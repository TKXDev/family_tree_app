import { NextRequest, NextResponse } from "next/server";
import * as tokenService from "@/lib/token-service";
import { verifyAuth } from "@/lib/server-auth";
import connectDB from "@/lib/mongodb";
import Token from "@/models/Token";

// Get all active sessions for the current user
export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { authenticated, user } = await verifyAuth(req);

    if (!authenticated || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all active sessions for the user
    const sessions = await tokenService.getUserSessions(user._id);

    // Format sessions for response (avoid sending the actual tokens)
    const formattedSessions = sessions.map((session) => ({
      id: session._id,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed,
      expiresAt: session.expires,
      userAgent: session.userAgent,
      isCurrentSession: session.token === tokenService.extractToken(req),
    }));

    return NextResponse.json({ sessions: formattedSessions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}

// Delete a specific session or all sessions (logout)
export async function DELETE(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { authenticated, user } = await verifyAuth(req);

    if (!authenticated || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");
    const all = searchParams.get("all") === "true";
    const currentToken = tokenService.extractToken(req);

    await connectDB();

    if (all) {
      // Revoke all sessions except current one
      await Token.updateMany(
        {
          userId: user._id,
          isValid: true,
          token: { $ne: currentToken },
        },
        { isValid: false }
      );

      return NextResponse.json(
        { message: "All other sessions terminated successfully" },
        { status: 200 }
      );
    } else if (sessionId) {
      // Find the session
      const session = await Token.findOne({ _id: sessionId, userId: user._id });

      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      // If trying to delete current session, return error
      if (session.token === currentToken) {
        return NextResponse.json(
          { error: "Cannot delete current session, use logout instead" },
          { status: 400 }
        );
      }

      // Invalidate the session
      await Token.updateOne({ _id: sessionId }, { isValid: false });

      return NextResponse.json(
        { message: "Session terminated successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Session ID or 'all' parameter required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error managing user sessions:", error);
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}
