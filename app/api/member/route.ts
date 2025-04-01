import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get member data from request body
    const memberData = await req.json();

    // Validate required fields
    const requiredFields = [
      "first_name",
      "last_name",
      "birth_date",
      "gender",
      "generation",
    ];
    for (const field of requiredFields) {
      if (!memberData[field]) {
        return NextResponse.json(
          { error: `Please provide ${field.replace("_", " ")}` },
          { status: 400 }
        );
      }
    }

    // Create new family member
    const newMember = await FamilyMember.create(memberData);

    // Update parent-child relationships if parents are provided
    if (memberData.parent_ids && memberData.parent_ids.length > 0) {
      // Add this member to children_ids of each parent
      await FamilyMember.updateMany(
        { _id: { $in: memberData.parent_ids } },
        { $push: { children_ids: newMember._id.toString() } }
      );
    }

    // Update spouse relationship if spouse is provided
    if (memberData.spouse_id) {
      await FamilyMember.findByIdAndUpdate(memberData.spouse_id, {
        $set: { spouse_id: newMember._id.toString() },
      });
    }

    return NextResponse.json(
      {
        message: "Family member added successfully",
        data: newMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding family member:", error);
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 }
    );
  }
}
