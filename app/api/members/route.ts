import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import { verifyAuth } from "@/lib/server-auth";
import * as tokenService from "@/lib/token-service";
import jwt from "jsonwebtoken";
import { isAdmin } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Get all members
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const members = await FamilyMember.find({});
    return NextResponse.json({ data: members }, { status: 200 });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// Create a new member
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Extract and log token details for debugging
    const token = tokenService.extractToken(req);
    console.log("POST /api/members - Token received:", token ? "Yes" : "No");
    if (!token) {
      return NextResponse.json(
        { error: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Log token structure
    const tokenParts = token.split(".");
    console.log(
      `Token format check: ${
        tokenParts.length === 3 ? "Valid (3 parts)" : "Invalid format"
      }`
    );

    // Try to decode the token (without verification) for debugging
    try {
      const decoded = jwt.decode(token);
      console.log("Token decode result:", decoded ? "Success" : "Failed");
      if (decoded && typeof decoded === "object") {
        console.log("Token payload:", {
          userId: decoded.userId || decoded.sub || "missing",
          role: decoded.role || "missing",
          exp: decoded.exp
            ? new Date(decoded.exp * 1000).toISOString()
            : "missing",
        });
      }
    } catch (decodeError) {
      console.error("Token decode error:", decodeError);
    }

    // Verify admin role using the central auth service
    const { authenticated, user } = await verifyAuth(req);
    console.log("Auth verification result:", {
      authenticated,
      userRole: user?.role,
    });

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Admin access required", currentRole: user?.role },
        { status: 403 }
      );
    }

    console.log("Admin access granted for member creation - User:", user);

    // Get member data from request body
    const memberData = await req.json();
    console.log("Creating new family member:", memberData);

    // Create new member
    const newMember = await FamilyMember.create(memberData);

    return NextResponse.json(
      {
        message: "Member added successfully",
        data: newMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member", details: (error as Error).message },
      { status: 500 }
    );
  }
}
