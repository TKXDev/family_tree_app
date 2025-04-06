/**
 * This script will generate a new admin token for a specific user
 * Use this when you need to directly create a token for an admin user
 */

// MongoDB connection string
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Email of user to generate token for
const USER_EMAIL = "tkxgames1@gmail.com";

// JWT secret from .env file
const JWT_SECRET =
  "c02efe311a3c997112bc74f83784f5e8767b5602eeca31befe49246e16e7da94e423cfe5245a890624b4edc737aa190c7b58af6aa21e268cf1e47c5d560cb955";

// Token expiry in days
const TOKEN_EXPIRY = "30d";

require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Create user schema
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["user", "admin", "main_admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Create token schema
const TokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["auth", "refresh", "reset", "verify"],
      default: "auth",
    },
    expires: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 86400, // 30 days
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Create models
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Token = mongoose.models.Token || mongoose.model("Token", TokenSchema);

const run = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Find the user by email
    const user = await User.findOne({ email: USER_EMAIL });

    if (!user) {
      console.log(`No user found with email: ${USER_EMAIL}`);
      return;
    }

    console.log(
      `Found user: ${user.name} (${user.email}) with role: ${user.role}`
    );

    // Create token payload
    const payload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role, // ใช้ role จากฐานข้อมูล
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Calculate expiry date
    const decoded = jwt.decode(token);
    const expires = new Date(decoded.exp * 1000);

    // Save token to database
    const newToken = new Token({
      userId: user._id.toString(),
      token: token,
      type: "auth",
      expires: expires,
      description: "Manual admin token generation",
    });

    await newToken.save();

    console.log(`Generated new token for ${user.email}`);
    console.log(
      `Token preview: ${token.substring(0, 15)}...${token.substring(
        token.length - 5
      )}`
    );
    console.log(`Role in token: ${payload.role}`);
    console.log(`Expires: ${expires}`);
    console.log("\nInstructions:");
    console.log("1. Completely log out of the application");
    console.log("2. Clear all cookies for localhost:3000 in your browser");
    console.log("3. Use the following token to authenticate directly:");
    console.log("\nFull token (copy this):");
    console.log(token);
  } catch (error) {
    console.error("Error generating admin token:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

// Execute the script
run();
