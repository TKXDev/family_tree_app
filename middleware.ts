import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import * as jose from "jose";
import { authApi } from "@/lib/api";

// Optional rate limiter
let ratelimit: any = null;
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const { Ratelimit } = require("@upstash/ratelimit");
    const { Redis } = require("@upstash/redis");

    // Initialize rate limiter only if Redis is available
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
      analytics: true,
    });
  }
} catch (error) {
  console.error("Failed to initialize rate limiter:", error);
}

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

// List of routes that require admin access
const ADMIN_ROUTES = [
  "/api/members$", // POST - create member
  "/api/members/[^/]+$", // PUT, DELETE - update/delete member with any ID
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  // Rate limiting for auth endpoints - only if Redis is configured
  if (
    ratelimit &&
    (path === "/api/auth/signin" || path === "/api/auth/signup")
  ) {
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

  // Check if the current path requires admin access
  const isAdminRoute = ADMIN_ROUTES.some((route) => {
    const regex = new RegExp(route);
    return regex.test(path);
  });

  console.log(
    `Checking path: ${path}, isAdminRoute: ${isAdminRoute}, method: ${request.method}`
  );

  // If it's an admin-only route and not a GET request, verify the user is an admin
  if (isAdminRoute && request.method !== "GET") {
    console.log(
      "Admin route detected with non-GET method, checking permissions"
    );

    // Get JWT token from cookies or Authorization header
    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      "";

    if (!token) {
      console.log("No token provided for admin route");
      return NextResponse.json(
        { error: "Unauthorized - No auth token provided" },
        { status: 401 }
      );
    }

    try {
      // Decode and verify the JWT token
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      const { payload } = await jose.jwtVerify(token, secret);

      console.log(
        "Middleware checking role:",
        JSON.stringify(payload, null, 2)
      );

      // Check if user has admin role - ensure we're looking at the correct property
      if (!payload.role || payload.role !== "admin") {
        console.log("Access denied: Not admin role", { role: payload.role });
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }

      console.log("Admin access granted for user with role:", payload.role);
    } catch (error) {
      console.error("JWT verification error:", error);
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com https://cdn.pixabay.com;"
  );

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/signin",
    "/signup",
    "/api/auth/:path*",
    "/api/members/:path*",
  ],
};
