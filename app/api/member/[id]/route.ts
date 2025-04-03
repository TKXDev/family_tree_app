import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import Relationship from "@/models/Relationship";
import { verifyAuth } from "@/lib/server-auth";

interface Params {
  params: {
    id: string;
  };
}

/**
 * Validate MongoDB ID format
 */
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Build standardized API error response
 */
function errorResponse(
  message: string,
  status: number = 500,
  details: any = null
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

// Get a single family member
export async function GET(req: NextRequest, params: Params) {
  try {
    // Validate ID format
    const id = params.params.id;
    if (!id || !isValidObjectId(id)) {
      return errorResponse("Invalid member ID format", 400);
    }

    // Check authentication
    const { authenticated } = await verifyAuth(req);
    if (!authenticated) {
      return errorResponse("Authentication required", 401);
    }

    // Connect to database
    await connectDB();

    // Find member with lean query for better performance
    const member = await FamilyMember.findById(id).lean();

    if (!member) {
      return errorResponse("Family member not found", 404);
    }

    return NextResponse.json({ data: member }, { status: 200 });
  } catch (error) {
    console.error("Error fetching family member:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return errorResponse(`Failed to fetch family member: ${message}`, 500);
  }
}

// Edit a family member
export async function PUT(req: NextRequest, params: Params) {
  try {
    // Validate ID format
    const id = params.params.id;
    if (!id || !isValidObjectId(id)) {
      return errorResponse("Invalid member ID format", 400);
    }

    // Check authentication
    const { authenticated, user } = await verifyAuth(req);
    if (!authenticated) {
      return errorResponse("Authentication required", 401);
    }

    // Check admin permission
    if (user && user.role !== "admin") {
      return errorResponse("Admin permission required", 403);
    }

    // Connect to database
    await connectDB();

    // Parse and validate request body
    let updateData;
    try {
      updateData = await req.json();
    } catch (e) {
      return errorResponse("Invalid request body", 400);
    }

    // Find the member to be updated first (to track relationship changes)
    const existingMember = await FamilyMember.findById(id);

    if (!existingMember) {
      return errorResponse("Family member not found", 404);
    }

    // Start a session for transaction
    const session = await FamilyMember.startSession();
    session.startTransaction();

    try {
      // Handle spouse relationship updates
      if (
        updateData.spouse_id !== undefined &&
        updateData.spouse_id !== existingMember.spouse_id
      ) {
        // Remove this member as spouse from the old spouse if it exists
        if (existingMember.spouse_id) {
          await FamilyMember.findByIdAndUpdate(
            existingMember.spouse_id,
            { $set: { spouse_id: null } },
            { session }
          );
        }

        // Set this member as spouse to the new spouse if provided
        if (updateData.spouse_id) {
          await FamilyMember.findByIdAndUpdate(
            updateData.spouse_id,
            { $set: { spouse_id: id } },
            { session }
          );
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

        // Process in parallel for efficiency
        const updatePromises = [];

        // Remove this member from children_ids of removed parents
        if (removedParents.length > 0) {
          updatePromises.push(
            FamilyMember.updateMany(
              { _id: { $in: removedParents } },
              { $pull: { children_ids: id } },
              { session }
            )
          );
        }

        // Add this member to children_ids of added parents
        if (addedParents.length > 0) {
          updatePromises.push(
            FamilyMember.updateMany(
              { _id: { $in: addedParents } },
              { $push: { children_ids: id } },
              { session }
            )
          );
        }

        // Wait for all updates to complete
        await Promise.all(updatePromises);
      }

      // Update the member
      const updatedMember = await FamilyMember.findByIdAndUpdate(
        id,
        updateData,
        { new: true, session } // Return the updated document
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return NextResponse.json(
        {
          message: "Family member updated successfully",
          data: updatedMember,
        },
        { status: 200 }
      );
    } catch (txError) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw txError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Error updating family member:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return errorResponse(`Failed to update family member: ${message}`, 500);
  }
}

// Delete a family member
export async function DELETE(req: NextRequest, params: Params) {
  try {
    // Validate ID format
    const id = params.params.id;
    if (!id || !isValidObjectId(id)) {
      return errorResponse("Invalid member ID format", 400);
    }

    // Check authentication
    const { authenticated, user } = await verifyAuth(req);
    if (!authenticated) {
      return errorResponse("Authentication required", 401);
    }

    // Check admin permission
    if (user && user.role !== "admin") {
      return errorResponse("Admin permission required", 403);
    }

    // Connect to database
    await connectDB();

    // Start a session for transaction
    const session = await FamilyMember.startSession();
    session.startTransaction();

    try {
      // Find the member to be deleted first (to handle relationship cleanup)
      const memberToDelete = await FamilyMember.findById(id).session(session);

      if (!memberToDelete) {
        await session.abortTransaction();
        session.endSession();
        return errorResponse("Family member not found", 404);
      }

      // Process relationship updates in parallel for efficiency
      const updatePromises = [];

      // Clean up parent-child relationships
      if (memberToDelete.parent_ids?.length > 0) {
        // Remove this member from children_ids of all parents
        updatePromises.push(
          FamilyMember.updateMany(
            { _id: { $in: memberToDelete.parent_ids } },
            { $pull: { children_ids: id } },
            { session }
          )
        );
      }

      // Clean up spouse relationship
      if (memberToDelete.spouse_id) {
        // Remove this member as spouse from their spouse
        updatePromises.push(
          FamilyMember.findByIdAndUpdate(
            memberToDelete.spouse_id,
            { $set: { spouse_id: null } },
            { session }
          )
        );
      }

      // Clean up children's parent references
      if (memberToDelete.children_ids?.length > 0) {
        // Remove this member from parent_ids of all children
        updatePromises.push(
          FamilyMember.updateMany(
            { _id: { $in: memberToDelete.children_ids } },
            { $pull: { parent_ids: id } },
            { session }
          )
        );
      }

      // Delete any relationships involving this member
      updatePromises.push(
        Relationship.deleteMany(
          { $or: [{ person1_id: id }, { person2_id: id }] },
          { session }
        )
      );

      // Delete the member
      updatePromises.push(FamilyMember.findByIdAndDelete(id, { session }));

      // Wait for all operations to complete
      await Promise.all(updatePromises);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return NextResponse.json(
        { message: "Family member deleted successfully" },
        { status: 200 }
      );
    } catch (txError) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw txError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Error deleting family member:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return errorResponse(`Failed to delete family member: ${message}`, 500);
  }
}
