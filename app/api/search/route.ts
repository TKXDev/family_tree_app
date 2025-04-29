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
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

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

    // Execute query with pagination
    const members = await FamilyMember.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalMembers = await FamilyMember.countDocuments(query);

    return NextResponse.json(
      {
        message: "Family members found",
        count: members.length,
        total: totalMembers,
        currentPage: page,
        totalPages: Math.ceil(totalMembers / limit),
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
