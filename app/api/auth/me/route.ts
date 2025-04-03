import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "") ||
      "";

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    try {
      // Decode and verify the JWT token
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);

      console.log("Current user payload:", payload);

      // Check if userId is in payload
      if (!payload.userId) {
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 401 }
        );
      }

      await connectDB();

      // Get user from database without returning password
      const user = await User.findById(payload.userId).select("-password");

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Return user with role
      return NextResponse.json(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("JWT verification error:", error);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in me route:", error);
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}
