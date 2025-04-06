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

// Update admin check - rename to checkIsAdmin to avoid name conflict
function checkIsAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "main_admin";
}

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

  // Define admin-only paths that require admin role
  const isAdminPath =
    path.startsWith("/dashboard/add-member") ||
    path.startsWith("/dashboard/edit-member") ||
    path === "/dashboard/admin";

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

  // Get traditional token from cookies or header with better extraction
  const authHeader = request.headers.get("Authorization") || "";

  // Check all our possible token cookies in order of preference
  const adminToken =
    request.cookies.get("admin_token")?.value ||
    request.cookies.get("visible_admin_token")?.value;

  const appToken = request.cookies.get("app_token")?.value;

  // Get token cookie, but avoid using NextAuth session
  const tokenCookie = request.cookies.get("token")?.value;
  const isNextAuthToken = tokenCookie === "nextauth_session";
  const tokenValue = isNextAuthToken ? null : tokenCookie;

  // Combine all token sources, with priority order
  const traditionalToken =
    adminToken ||
    appToken ||
    tokenValue ||
    (authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "");

  // Log token presence for debugging
  console.log(
    `Path ${path}: Token present: ${!!traditionalToken || !!nextAuthToken}`,
    `Admin token: ${!!adminToken}`,
    `App token: ${!!appToken}`,
    `Token cookie: ${!!tokenCookie}${isNextAuthToken ? " (NextAuth)" : ""}`,
    `Traditional token: ${!!traditionalToken}`,
    `NextAuth token: ${!!nextAuthToken}`
  );

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
    url.searchParams.set("callbackUrl", path);
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

    // Get JWT token from cookies or Authorization header in order of preference
    const authHeader = request.headers.get("Authorization") || "";
    const adminToken =
      request.cookies.get("admin_token")?.value ||
      request.cookies.get("visible_admin_token")?.value;

    const appToken = request.cookies.get("app_token")?.value;

    // Get token cookie, but avoid using NextAuth session
    const tokenCookie = request.cookies.get("token")?.value;
    const isNextAuthToken = tokenCookie === "nextauth_session";
    const tokenValue = isNextAuthToken ? null : tokenCookie;

    // Combine all token sources, with priority order
    const token =
      adminToken ||
      appToken ||
      tokenValue ||
      (authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "") ||
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

      // Check if user has admin role
      if (
        !payload.role ||
        !(payload.role === "admin" || payload.role === "main_admin")
      ) {
        console.log("Access denied: Not admin role", { role: payload.role });
        return NextResponse.json(
          { error: "Admin access required" },
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

  // Admin role check for admin-only paths
  if (isAdminPath && isAuthenticated) {
    console.log(`Checking admin access for path: ${path}`);
    let isAdmin = false;

    // Check if user has admin role via NextAuth
    if (nextAuthToken) {
      isAdmin = checkIsAdmin(nextAuthToken.role as string);
      console.log(
        `NextAuth admin check: ${isAdmin}, role: ${nextAuthToken.role}`
      );
    }

    // If not admin via NextAuth, try traditional token
    if (!isAdmin && traditionalToken) {
      try {
        // Decode the token
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || "default_secret"
        );
        const { payload } = await jose.jwtVerify(traditionalToken, secret);

        console.log(
          "Traditional token payload:",
          JSON.stringify(payload, null, 2)
        );

        // Check if user has admin role
        isAdmin = checkIsAdmin(payload.role as string);
        console.log(`Token admin check: ${isAdmin}, role: ${payload.role}`);

        if (!isAdmin) {
          console.log("Non-admin user trying to access admin path");
          // Redirect non-admin users to dashboard with a query parameter
          const url = new URL("/dashboard?error=adminRequired", request.url);
          const response = NextResponse.redirect(url);

          // Set a temporary cookie to show an error message
          response.cookies.set("auth_error", "Admin access required", {
            maxAge: 30, // 30 seconds
            path: "/",
          });

          return response;
        }
      } catch (error) {
        console.error("Token verification error:", error);
        // If token is invalid, redirect to login
        const url = new URL("/signin", request.url);
        url.searchParams.set("callbackUrl", path);
        url.searchParams.set("error", "invalidToken");
        return NextResponse.redirect(url);
      }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$).*)",
  ],
};
