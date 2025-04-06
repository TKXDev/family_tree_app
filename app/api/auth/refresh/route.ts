import { NextRequest, NextResponse } from "next/server";
import * as tokenService from "@/lib/token-service";
import connectDB from "@/lib/mongodb";
import Token from "@/models/Token";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not provided" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the refresh token in the database
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      type: "refresh",
      isValid: true,
      expires: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, JWT_SECRET) as any;

      // Check if user is admin to determine token expiry
      const isAdmin = payload.role === "admin";

      // Check if persistent login was enabled
      const isPersistent =
        req.cookies.get("persistent_login")?.value === "true";

      // Set token expiry based on role and persistent login preference
      const tokenExpiry = isAdmin
        ? isPersistent
          ? "90d"
          : "30d"
        : isPersistent
        ? "30d"
        : "1d";
      const refreshTokenExpiry = isAdmin
        ? isPersistent
          ? "180d"
          : "90d"
        : isPersistent
        ? "90d"
        : "7d";

      console.log("Refreshing token with expiry:", {
        isAdmin,
        isPersistent,
        tokenExpiry,
        refreshTokenExpiry,
      });

      // Create new token pair with the same payload
      const {
        accessToken,
        refreshToken: newRefreshToken,
        accessExpires,
        refreshExpires,
      } = await tokenService.createTokenPair(
        {
          userId: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        },
        req.headers.get("user-agent") || undefined,
        tokenExpiry,
        refreshTokenExpiry
      );

      // Invalidate the old refresh token
      await Token.updateOne({ _id: tokenDoc._id }, { isValid: false });

      // Set new tokens in response
      const response = NextResponse.json(
        {
          message: "Token refreshed successfully",
          expiresAt: accessExpires.toISOString(),
        },
        { status: 200 }
      );

      // Set HTTP-only cookie for new tokens
      response.cookies.set("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: accessExpires,
        path: "/",
      });

      response.cookies.set("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: refreshExpires,
        path: "/",
      });

      // Log additional info for admin users
      if (isAdmin) {
        console.log("Admin token refreshed with extended duration:", {
          tokenExpiry,
          refreshTokenExpiry,
          accessExpires: accessExpires.toISOString(),
          refreshExpires: refreshExpires.toISOString(),
        });
      }

      return response;
    } catch (err) {
      // JWT verification failed
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in refresh token route:", error);
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}
