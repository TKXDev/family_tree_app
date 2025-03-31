import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as jose from "jose";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
  analytics: true,
});

const JWT_SECRET = process.env.JWT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error("Missing required environment variables");
}

// Verify token with jose instead of jsonwebtoken
async function verifyJWT(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jose.jwtVerify(token, secret);
    return true;
  } catch (error) {
    return false;
  }
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  // Rate limiting for auth endpoints
  if (path === "/api/auth/signin" || path === "/api/auth/signup") {
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `auth_${ip}`
    );

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          limit,
          reset,
          remaining,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }
  }

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/" ||
    path === "/signin" ||
    path === "/signup" ||
    path.startsWith("/_next") ||
    path.startsWith("/api/auth");

  // Get traditional token from cookies with secure flags
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
    const response = NextResponse.next();
    response.cookies.delete("token");
    response.cookies.delete("persistent_login");
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
    let isValid = !!nextAuthToken;

    if (traditionalToken && !isValid) {
      isValid = await verifyJWT(traditionalToken);
      if (!isValid) {
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

  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/dashboard/:path*", "/signin", "/signup", "/api/auth/:path*"],
};
