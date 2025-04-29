import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import { verifyAuth } from "@/lib/server-auth";
import { isAdmin } from "@/lib/auth";

interface Params {
  params: {
    id: string;
  };
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

    console.log("Starting member update request for ID:", params.id);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    console.log(
      "Request cookies:",
      req.cookies
        .getAll()
        .map((c) => `${c.name}=${c.value.substring(0, 10)}...`)
        .join(", ")
    );

    // Verify admin role using the central auth service
    const { authenticated, user } = await verifyAuth(req);

    console.log("Auth verification result:", {
      authenticated,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        : null,
    });

    if (!authenticated) {
      console.log("Authentication failed: No valid token");
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    if (!user) {
      console.log("Authentication failed: No user data in token");
      return NextResponse.json(
        { error: "Unauthorized - Invalid user data" },
        { status: 401 }
      );
    }

    console.log("User authenticated with role:", user.role);

    if (!isAdmin(user)) {
      console.log("Authorization failed: User is not an admin");
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    console.log("Admin access granted for member update");

    const { id } = params;
    const updateData = await req.json();

    console.log("Updating member with data:", {
      id,
      fields: Object.keys(updateData),
    });

    const updatedMember = await FamilyMember.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedMember) {
      console.log("Member not found with ID:", id);
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    console.log("Member updated successfully");
    return NextResponse.json(
      {
        message: "Member updated successfully",
        data: updatedMember,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating member:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update member";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Delete a member
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin role using the central auth service
    const { authenticated, user } = await verifyAuth(req);

    if (!authenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
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
