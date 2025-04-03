import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Utility function to verify the admin role
async function verifyAdminRole(req: NextRequest) {
  // Get token from cookies or Authorization header
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "") ||
    "";

  if (!token) {
    console.log("No token provided");
    return {
      authorized: false,
      error: "Unauthorized - No token provided",
      status: 401,
    };
  }

  try {
    // Decode and verify the JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    console.log(
      "Token payload in members API:",
      JSON.stringify(payload, null, 2)
    );

    // Check if user has admin role
    if (!payload.role || payload.role !== "admin") {
      console.log("Non-admin access attempt:", payload);
      return {
        authorized: false,
        error: "Forbidden - Admin access required",
        status: 403,
        payload,
      };
    }

    return { authorized: true, payload };
  } catch (error) {
    console.error("JWT verification error:", error);
    return {
      authorized: false,
      error: "Unauthorized - Invalid token",
      status: 401,
    };
  }
}

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

    // Verify admin role
    const authResult = await verifyAdminRole(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error, details: authResult.payload },
        { status: authResult.status }
      );
    }

    console.log("Admin access granted for member creation");

    // Get member data from request body
    const memberData = await req.json();

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
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
