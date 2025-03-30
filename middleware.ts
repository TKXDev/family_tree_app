import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/signin" ||
    path === "/signup" ||
    path.startsWith("/_next") ||
    path.startsWith("/api/auth");

  // Get traditional token from cookies
  const traditionalToken = request.cookies.get("token")?.value || "";

  // Check for next-auth session token
  let nextAuthToken = null;
  try {
    nextAuthToken = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error("Error getting NextAuth token:", error);
  }

  // User is authenticated if either token is present
  const isAuthenticated = !!nextAuthToken || !!traditionalToken;

  // Check for persistent login
  const persistentLogin =
    request.cookies.get("persistent_login")?.value === "true";

  // Track redirections to prevent loops
  const redirectCount = parseInt(
    request.headers.get("x-redirect-count") || "0"
  );

  // If we've redirected too many times, stop trying to redirect
  if (redirectCount > 2) {
    // Clear cookies if there's a redirect loop
    const response = NextResponse.next();

    if (traditionalToken) {
      response.cookies.delete("token");
      response.cookies.delete("persistent_login");
    }

    return response;
  }

  // If trying to access dashboard without being logged in, redirect to signin
  if (!isPublicPath && !isAuthenticated) {
    const url = new URL("/signin", request.nextUrl.origin);
    const response = NextResponse.redirect(url);
    response.headers.set("x-redirect-count", (redirectCount + 1).toString());
    return response;
  }

  // If trying to access signin or signup while already logged in, redirect to dashboard
  if (
    isPublicPath &&
    isAuthenticated &&
    (path === "/signin" || path === "/signup")
  ) {
    // For traditional token, verify it's valid
    let isValid = !!nextAuthToken; // NextAuth token is already verified

    if (traditionalToken && !isValid) {
      try {
        verify(traditionalToken, JWT_SECRET);
        isValid = true;
      } catch (error) {
        // Invalid token, clear it
        const response = NextResponse.next();
        response.cookies.delete("token");
        response.cookies.delete("persistent_login");
        return response;
      }
    }

    if (isValid) {
      const url = new URL("/dashboard", request.nextUrl.origin);
      const response = NextResponse.redirect(url);
      response.headers.set("x-redirect-count", (redirectCount + 1).toString());
      return response;
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/dashboard/:path*", "/signin", "/signup"],
};
