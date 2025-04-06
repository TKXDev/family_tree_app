/**
 * This script will reset all tokens for a specific user
 * Use this when role changes don't seem to take effect
 */

// MongoDB connection string
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Email of user to reset tokens
const USER_EMAIL = "tkxgames1@gmail.com";

require("dotenv").config();
const mongoose = require("mongoose");

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

    // Delete all tokens for this user
    const result = await Token.deleteMany({ userId: user._id.toString() });

    console.log(`Deleted ${result.deletedCount} tokens for user ${user.email}`);
    console.log(
      "User will need to login again to get a new token with updated role"
    );
  } catch (error) {
    console.error("Error resetting tokens:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

// Execute the script
run();
