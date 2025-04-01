import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;

interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export async function verifyAuth(req: NextRequest) {
  try {
    // Check traditional auth token from cookies
    const traditionalToken = req.cookies.get("token")?.value;

    // Check for NextAuth session token
    const nextAuthToken = await getToken({
      req,
      secret: NEXTAUTH_SECRET,
    });

    // If NextAuth token exists, user is authenticated
    if (nextAuthToken) {
      return {
        authenticated: true,
        user: {
          _id: nextAuthToken.sub as string,
          name: nextAuthToken.name as string,
          email: nextAuthToken.email as string,
          role: (nextAuthToken as any).role || "user",
        },
      };
    }

    // Otherwise, try to verify the traditional token
    if (traditionalToken) {
      const decoded = jwt.verify(traditionalToken, JWT_SECRET) as JwtPayload;

      if (decoded) {
        return {
          authenticated: true,
          user: {
            _id: decoded.userId,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          },
        };
      }
    }

    // No valid token found
    return { authenticated: false, user: null };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { authenticated: false, user: null };
  }
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
