import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import Relationship from "@/models/Relationship";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch all family members
    const familyMembers = await FamilyMember.find({});

    // Fetch all relationships
    const relationships = await Relationship.find({});

    // Organize data into a tree structure
    const treeData = {
      members: familyMembers,
      relationships: relationships,
    };

    return NextResponse.json(
      {
        message: "Family tree data retrieved successfully",
        data: treeData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching family tree:", error);
    return NextResponse.json(
      { error: "Failed to fetch family tree data" },
      { status: 500 }
    );
  }
}
