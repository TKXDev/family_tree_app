import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // For client-side logout, we just need to return a successful response
    // The actual token invalidation happens on the client side by removing the token from storage

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in logout route:", error);
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}
