import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, role = "user" } = await req.json();

    // Check if all fields exist
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please provide all required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({ name, email, password, role });

    // Create token with user role
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Include role in the token
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password from response
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in signup route:", error);
    return NextResponse.json(
      { error: "Server error, please try again later" },
      { status: 500 }
    );
  }
}

// Helper function to generate JWT token
function generateToken(_id: string) {
  // This is just a placeholder - you would typically use jwt.sign here
  // For example: return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  return "token_placeholder";
}
