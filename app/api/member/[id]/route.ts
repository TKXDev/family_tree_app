import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import Relationship from "@/models/Relationship";

interface Params {
  params: {
    id: string;
  };
}

// Get a single family member
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    const member = await FamilyMember.findById(id);

    if (!member) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: member,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching family member:", error);
    return NextResponse.json(
      { error: "Failed to fetch family member" },
      { status: 500 }
    );
  }
}

// Edit a family member
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;
    const updateData = await req.json();

    // Find the member to be updated first (to track relationship changes)
    const existingMember = await FamilyMember.findById(id);

    if (!existingMember) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Handle spouse relationship updates
    if (
      updateData.spouse_id !== undefined &&
      updateData.spouse_id !== existingMember.spouse_id
    ) {
      // Remove this member as spouse from the old spouse if it exists
      if (existingMember.spouse_id) {
        await FamilyMember.findByIdAndUpdate(existingMember.spouse_id, {
          $set: { spouse_id: null },
        });
      }

      // Set this member as spouse to the new spouse if provided
      if (updateData.spouse_id) {
        await FamilyMember.findByIdAndUpdate(updateData.spouse_id, {
          $set: { spouse_id: id },
        });
      }
    }

    // Handle parent-child relationship updates
    if (updateData.parent_ids !== undefined) {
      const oldParentIds = existingMember.parent_ids || [];
      const newParentIds = updateData.parent_ids || [];

      // Find parents removed from the list
      const removedParents = oldParentIds.filter(
        (p: string) => !newParentIds.includes(p)
      );

      // Find parents added to the list
      const addedParents = newParentIds.filter(
        (p: string) => !oldParentIds.includes(p)
      );

      // Remove this member from children_ids of removed parents
      if (removedParents.length > 0) {
        await FamilyMember.updateMany(
          { _id: { $in: removedParents } },
          { $pull: { children_ids: id } }
        );
      }

      // Add this member to children_ids of added parents
      if (addedParents.length > 0) {
        await FamilyMember.updateMany(
          { _id: { $in: addedParents } },
          { $push: { children_ids: id } }
        );
      }
    }

    // Update the member
    const updatedMember = await FamilyMember.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    return NextResponse.json(
      {
        message: "Family member updated successfully",
        data: updatedMember,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating family member:", error);
    return NextResponse.json(
      { error: "Failed to update family member" },
      { status: 500 }
    );
  }
}

// Delete a family member
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    // Find the member to be deleted first (to handle relationship cleanup)
    const memberToDelete = await FamilyMember.findById(id);

    if (!memberToDelete) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // Clean up parent-child relationships
    if (memberToDelete.parent_ids?.length > 0) {
      // Remove this member from children_ids of all parents
      await FamilyMember.updateMany(
        { _id: { $in: memberToDelete.parent_ids } },
        { $pull: { children_ids: id } }
      );
    }

    // Clean up spouse relationship
    if (memberToDelete.spouse_id) {
      // Remove this member as spouse from their spouse
      await FamilyMember.findByIdAndUpdate(memberToDelete.spouse_id, {
        $set: { spouse_id: null },
      });
    }

    // Clean up children's parent references
    if (memberToDelete.children_ids?.length > 0) {
      // Remove this member from parent_ids of all children
      await FamilyMember.updateMany(
        { _id: { $in: memberToDelete.children_ids } },
        { $pull: { parent_ids: id } }
      );
    }

    // Delete any relationships involving this member
    await Relationship.deleteMany({
      $or: [{ person1_id: id }, { person2_id: id }],
    });

    // Delete the member
    await FamilyMember.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Family member deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting family member:", error);
    return NextResponse.json(
      { error: "Failed to delete family member" },
      { status: 500 }
    );
  }
}
