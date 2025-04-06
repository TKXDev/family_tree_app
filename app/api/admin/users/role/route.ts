import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuth } from "@/lib/server-auth";
import * as tokenService from "@/lib/token-service";
import { isAdmin, isMainAdmin, canPromoteToAdmin } from "@/lib/auth";

// Update a user's role (main admin can promote to admin, both admin types can demote)
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { authenticated, user } = await verifyAuth(req);

    if (!authenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify at least admin role
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get request body
    const { userId, role } = await req.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!role || !["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role (admin or user) is required" },
        { status: 400 }
      );
    }

    // Prevent updating your own role
    if (userId === user._id) {
      return NextResponse.json(
        { error: "You cannot modify your own role" },
        { status: 400 }
      );
    }

    // Check if promoting to admin
    const isPromotion = role === "admin";

    // For promotions to admin, check if current user is main admin
    if (isPromotion && !isMainAdmin(user)) {
      return NextResponse.json(
        {
          error: "Only the main administrator can promote users to admin role",
        },
        { status: 403 }
      );
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot demote the main admin
    if (targetUser.role === "main_admin" && role !== "main_admin") {
      return NextResponse.json(
        { error: "The main administrator cannot be demoted" },
        { status: 403 }
      );
    }

    // Update the user's role
    targetUser.role = role;
    await targetUser.save();

    // If promoting to admin, generate a new auth token
    let tokenInfo = null;
    if (isPromotion) {
      // Create token payload
      const payload = {
        userId: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: "admin",
      };

      // Generate a new token
      const { token, expires } = tokenService.generateToken(payload);

      // Save token to database
      await tokenService.saveToken(
        payload.userId,
        token,
        expires,
        "auth",
        "Admin Promotion"
      );

      // Store token info to return to frontend
      tokenInfo = {
        expires: expires.toISOString(),
        tokenPreview: `${token.substring(0, 10)}...${token.substring(
          token.length - 5
        )}`,
      };

      console.log(`Generated new admin token for ${targetUser.email}`);
    }

    // Return the updated user (without password)
    const updatedUser = await User.findById(userId).select("-password");

    return NextResponse.json(
      {
        message: `User ${
          role === "admin" ? "promoted to admin" : "demoted to user"
        }`,
        data: updatedUser,
        tokenInfo: tokenInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
