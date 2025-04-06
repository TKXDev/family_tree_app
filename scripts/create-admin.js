/**
 * Script to create an admin user in the database
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// MongoDB connection string (directly from .env.local)
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
    const hashedPassword = await bcrypt.hash("AdminPassword123!", salt);

    // Create admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created successfully:");
    console.log("Email: admin@example.com");
    console.log("Password: AdminPassword123!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
};

connectDB();
