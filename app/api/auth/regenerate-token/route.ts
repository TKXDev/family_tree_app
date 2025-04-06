import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// This endpoint helps regenerate tokens when they're expired or missing
export async function GET(req: NextRequest) {
  try {
    console.log("Regenerate token endpoint called");

    // Try to get token from cookies using req.cookies directly
    const tokenCookie = req.cookies.get("token");
    const adminTokenCookie = req.cookies.get("admin_token");
    const visibleAdminTokenCookie = req.cookies.get("visible_admin_token");

    // Extract values from cookie objects
    const token =
      tokenCookie?.value ||
      adminTokenCookie?.value ||
      visibleAdminTokenCookie?.value;

    console.log("Regenerate token - found cookie:", !!token);

    // If we already have a valid token, just refresh its expiry
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        console.log("Existing token is valid, refreshing expiry");

        // Generate a new token with the same user info
        const newToken = jwt.sign(
          {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          },
          JWT_SECRET,
          { expiresIn: MAX_AGE }
        );

        // Set the refreshed token in cookies
        const response = NextResponse.json({
          success: true,
          message: "Token refreshed successfully",
          token: newToken,
        });

        // Set expiry date
        const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

        response.cookies.set({
          name: "token",
          value: newToken,
          httpOnly: true,
          expires: expiresAt,
          path: "/",
        });

        // For admin users, also set admin tokens
        if (decoded.role === "admin" || decoded.role === "main_admin") {
          response.cookies.set({
            name: "admin_token",
            value: newToken,
            httpOnly: true,
            expires: expiresAt,
            path: "/",
          });

          // Also set a visible token for frontend use
          response.cookies.set({
            name: "visible_admin_token",
            value: newToken,
            httpOnly: false,
            expires: expiresAt,
            path: "/",
          });
        }

        return response;
      } catch (verifyError) {
        console.error("Token verification failed:", verifyError);
        // Token is invalid, we'll try to generate a new one below
      }
    }

    // Get all the user's information from the auth header
    const authHeader = req.headers.get("Authorization") || "";
    let tokenFromAuth = null;

    if (authHeader.startsWith("Bearer ")) {
      tokenFromAuth = authHeader.substring(7);
      console.log("Found token in Authorization header");

      try {
        const decoded = jwt.verify(tokenFromAuth, JWT_SECRET) as any;
        console.log("Auth header token is valid");

        // Generate a new token
        const newToken = jwt.sign(
          {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          },
          JWT_SECRET,
          { expiresIn: MAX_AGE }
        );

        // Set the refreshed token in cookies
        const response = NextResponse.json({
          success: true,
          message: "Token refreshed from auth header",
          token: newToken,
        });

        // Set expiry date
        const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

        response.cookies.set({
          name: "token",
          value: newToken,
          httpOnly: true,
          expires: expiresAt,
          path: "/",
        });

        // For admin users, also set admin tokens
        if (decoded.role === "admin" || decoded.role === "main_admin") {
          response.cookies.set({
            name: "admin_token",
            value: newToken,
            httpOnly: true,
            expires: expiresAt,
            path: "/",
          });

          // Also set a visible token for frontend use
          response.cookies.set({
            name: "visible_admin_token",
            value: newToken,
            httpOnly: false,
            expires: expiresAt,
            path: "/",
          });
        }

        return response;
      } catch (error) {
        console.error("Error verifying auth header token:", error);
      }
    }

    // Try to use NextAuth token
    console.log("Checking for NextAuth session token");
    try {
      const nextAuthToken = await getToken({
        req,
        secret: NEXTAUTH_SECRET,
      });

      if (nextAuthToken) {
        console.log("NextAuth token found:", nextAuthToken);

        // Get user details from nextAuth token
        const userId = nextAuthToken.sub;
        const email = nextAuthToken.email as string;
        const name = (nextAuthToken.name as string) || email.split("@")[0];
        const role = (nextAuthToken.role as string) || "user";

        console.log("NextAuth user info:", { userId, email, role });

        // Generate a new token with the user info from NextAuth
        const newToken = jwt.sign(
          {
            userId: userId,
            email: email,
            role: role,
            name: name,
          },
          JWT_SECRET,
          { expiresIn: MAX_AGE }
        );

        // Set the token in cookies
        const response = NextResponse.json({
          success: true,
          message: "Token generated from NextAuth session",
          token: newToken,
        });

        // Set expiry date
        const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

        response.cookies.set({
          name: "token",
          value: newToken,
          httpOnly: true,
          expires: expiresAt,
          path: "/",
        });

        // For admin users, also set admin tokens
        if (role === "admin" || role === "main_admin") {
          response.cookies.set({
            name: "admin_token",
            value: newToken,
            httpOnly: true,
            expires: expiresAt,
            path: "/",
          });

          // Also set a visible token for frontend use
          response.cookies.set({
            name: "visible_admin_token",
            value: newToken,
            httpOnly: false,
            expires: expiresAt,
            path: "/",
          });
        }

        return response;
      } else {
        console.log("No NextAuth token found");
      }
    } catch (nextAuthError) {
      console.error("Error getting NextAuth token:", nextAuthError);
    }

    // If we've gotten here, we couldn't refresh a token
    // Try to find a user by email query parameter as a last resort
    const userEmail = req.nextUrl.searchParams.get("email");

    if (!userEmail) {
      console.error("No email provided and no valid tokens found");
      return NextResponse.json(
        { success: false, error: "No user email found and no valid tokens" },
        { status: 401 }
      );
    }

    // Connect to database and find user by email
    await connectDB();
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error("User not found with email:", userEmail);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Generate a new token
    const newToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: MAX_AGE }
    );

    // Set the new token in cookies
    const response = NextResponse.json({
      success: true,
      message: "New token generated successfully",
      token: newToken,
    });

    // Set expiry date
    const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

    response.cookies.set({
      name: "token",
      value: newToken,
      httpOnly: true,
      expires: expiresAt,
      path: "/",
    });

    // For admin users, also set admin tokens
    if (user.role === "admin" || user.role === "main_admin") {
      response.cookies.set({
        name: "admin_token",
        value: newToken,
        httpOnly: true,
        expires: expiresAt,
        path: "/",
      });

      // Also set a visible token for frontend use
      response.cookies.set({
        name: "visible_admin_token",
        value: newToken,
        httpOnly: false,
        expires: expiresAt,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error regenerating token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate token" },
      { status: 500 }
    );
  }
}
