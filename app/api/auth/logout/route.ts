import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // Log all cookies for debugging
    console.log("Clearing all auth cookies");

    // Clear all possible auth cookies
    const tokenCookies = [
      "token",
      "client_token",
      "admin_token",
      "visible_admin_token",
      "app_token",
      "refresh_token",
      "persistent_login",
      "nextauth_integration",
      "auth_error",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "next-auth.pkce.code_verifier",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "__Secure-next-auth.csrf-token",
      "__Host-next-auth.csrf-token",
    ];

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
        redirectUrl: "/signin",
      },
      { status: 200 }
    );

    // Clear cookies in the response - for root path
    tokenCookies.forEach((cookieName) => {
      response.cookies.delete(cookieName);
    });

    // Also clear cookies for specific paths that might have been set
    tokenCookies.forEach((cookieName) => {
      // For /dashboard path
      response.cookies.delete(cookieName, {
        path: "/dashboard",
      });

      // For /signin path
      response.cookies.delete(cookieName, {
        path: "/signin",
      });

      // For /api path
      response.cookies.delete(cookieName, {
        path: "/api",
      });
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
