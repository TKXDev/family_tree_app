import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password, rememberMe = false } = await req.json();

    // Check if all fields exist
    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide email and password" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Create token payload
    const tokenPayload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Set token expiry based on role and remember me option
    const userIsAdmin = user.role === "admin" || user.role === "main_admin";
    const tokenExpiry = userIsAdmin
      ? rememberMe
        ? "90d"
        : "30d"
      : rememberMe
      ? "30d"
      : "1d";

    // Create JWT token
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: tokenExpiry,
    });

    // Calculate expiry date for cookies
    const decoded = jwt.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    // User data to return in response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Create response
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userData,
        token: token, // Include token in response
        expiresAt: expiresAt.toISOString(),
      },
      { status: 200 }
    );

    // Set cookies
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

    // Set a non-httpOnly version for client-side access
    response.cookies.set("client_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

    // Admin-specific token for protected routes
    if (userIsAdmin) {
      response.cookies.set("admin_token", token, {
        httpOnly: false, // Make it visible in client for debugging
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: expiresAt,
        path: "/",
      });
    }

    // Set persistent login flag if rememberMe is true
    if (rememberMe) {
      response.cookies.set("persistent_login", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: expiresAt,
        path: "/",
      });
    }

    console.log("Cookies set successfully");

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
