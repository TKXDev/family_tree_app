import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

interface Params {
  params: {
    id: string;
  };
}

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
      "Token payload in member[id] API:",
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

// Get a single member
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = params;
    const member = await FamilyMember.findById(id);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ data: member }, { status: 200 });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// Update a member
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Check if user is admin
    const authResult = await verifyAdminRole(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error, details: authResult.payload },
        { status: authResult.status }
      );
    }

    console.log("Admin access granted for member update");

    const { id } = params;
    const updateData = await req.json();

    const updatedMember = await FamilyMember.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Member updated successfully",
        data: updatedMember,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// Delete a member
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Check if user is admin
    const authResult = await verifyAdminRole(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error, details: authResult.payload },
        { status: authResult.status }
      );
    }

    console.log("Admin access granted for member deletion");

    const { id } = params;
    const deletedMember = await FamilyMember.findByIdAndDelete(id);

    if (!deletedMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Member deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
