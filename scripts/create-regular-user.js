/**
 * Script to create a regular user in the database
 */

// MongoDB connection string (directly from .env.local)
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database");

    // Create a user schema
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: {
        type: String,
        enum: ["user", "admin", "main_admin"],
        default: "user",
      },
    });

    // Create model
    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("UserPassword123!", salt);

    // Create regular user
    const user = new User({
      name: "Regular User",
      email: "user@example.com",
      password: hashedPassword,
      role: "user", // Regular user role
    });

    await user.save();
    console.log("Regular user created successfully:");
    console.log("Email: user@example.com");
    console.log("Password: UserPassword123!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
};

connectDB();
