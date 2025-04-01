import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get URL parameters
    const url = new URL(req.url);
    const generation = url.searchParams.get("generation");
    const firstName = url.searchParams.get("firstName");
    const lastName = url.searchParams.get("lastName");
    const gender = url.searchParams.get("gender");

    // Build query object based on provided parameters
    const query: any = {};

    if (generation) {
      query.generation = parseInt(generation);
    }

    if (firstName) {
      query.first_name = { $regex: firstName, $options: "i" }; // case-insensitive search
    }

    if (lastName) {
      query.last_name = { $regex: lastName, $options: "i" }; // case-insensitive search
    }

    if (gender) {
      query.gender = gender;
    }

    // Execute query
    const members = await FamilyMember.find(query);

    return NextResponse.json(
      {
        message: "Family members found",
        count: members.length,
        data: members,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error searching family members:", error);
    return NextResponse.json(
      { error: "Failed to search family members" },
      { status: 500 }
    );
  }
}
