import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;

interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin" | "main_admin";
}

export async function verifyAuth(req: NextRequest) {
  try {
    // Log the request path for debugging
    console.log("Verifying authentication for path:", req.nextUrl.pathname);

    // First try to extract JWT token from request
    const token = extractToken(req);

    // Check for NextAuth session token in parallel
    const nextAuthToken = await getToken({
      req,
      secret: NEXTAUTH_SECRET,
    });

    // If NextAuth token exists, user is authenticated through NextAuth
    if (nextAuthToken) {
      const role = (nextAuthToken as any).role || "user";
      console.log("NextAuth token verified, user role:", role);

      return {
        authenticated: true,
        user: {
          _id: nextAuthToken.sub as string,
          name: nextAuthToken.name as string,
          email: nextAuthToken.email as string,
          role: role,
        },
      };
    }

    // If custom token exists, verify it
    if (token) {
      try {
        // Verify the token signature and expiration
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

        console.log("JWT token verified successfully");

        return {
          authenticated: true,
          user: {
            _id: payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role,
          },
        };
      } catch (jwtError) {
        console.error("JWT verification failed:", jwtError);
        // If token verification fails (expired or invalid), return not authenticated
        return { authenticated: false, user: null };
      }
    }

    // No valid tokens found
    console.log("No valid authentication tokens found");
    return { authenticated: false, user: null };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { authenticated: false, user: null };
  }
}

// Helper function to extract token from request
function extractToken(req: NextRequest): string | null {
  // Log available cookies for debugging
  console.log(
    "Available cookies:",
    req.cookies
      .getAll()
      .map((c) => c.name)
      .join(", ")
  );

  // Try different token cookies with priority
  const tokenFromCookie =
    req.cookies.get("admin_token")?.value ||
    req.cookies.get("token")?.value ||
    req.cookies.get("client_token")?.value;

  if (tokenFromCookie) {
    console.log("Found token in cookies");
    return tokenFromCookie;
  }

  // If no cookie, check Authorization header
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    console.log("Found token in Authorization header");
    return authHeader.substring(7);
  }

  console.log("No token found in request");
  return null;
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
