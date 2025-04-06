import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/server-auth";
import * as tokenService from "@/lib/token-service";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    console.log("Admin check requested");

    // Extract and log the token
    const token = tokenService.extractToken(req);
    console.log("Token present:", !!token);

    // Verify the user's authentication and role
    const { authenticated, user } = await verifyAuth(req);

    if (!authenticated) {
      console.log("User not authenticated");
      return NextResponse.json(
        { isAuthenticated: false, isAdmin: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userIsAdmin = isAdmin(user);

    console.log("User authenticated:", {
      userId: user?._id,
      name: user?.name,
      role: user?.role,
      isAdmin: userIsAdmin,
    });

    return NextResponse.json({
      isAuthenticated: true,
      isAdmin: userIsAdmin,
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
