/**
 * This script will automatically set the first admin user as the main_admin user
 * without requiring confirmation
 */

// MongoDB connection string (directly from .env.local)
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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

// Create user model if it doesn't exist already
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const run = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Find the first admin user (oldest by creation date)
    const adminUser = await User.findOne({ role: "admin" }).sort({
      createdAt: 1,
    });

    if (!adminUser) {
      console.log("No admin users found in the database.");
      console.log("Please create an admin user first.");
      return;
    }

    console.log(`Found admin user: ${adminUser.name} (${adminUser.email})`);

    // Check if there's already a main_admin
    const mainAdmin = await User.findOne({ role: "main_admin" });
    if (mainAdmin) {
      console.log(
        `There is already a main admin: ${mainAdmin.name} (${mainAdmin.email})`
      );
      console.log("Replacing with the new main admin...");

      // Demote the current main admin to admin
      if (mainAdmin._id.toString() !== adminUser._id.toString()) {
        mainAdmin.role = "admin";
        await mainAdmin.save();
        console.log(
          `Previous main admin ${mainAdmin.email} has been demoted to admin.`
        );
      }
    }

    // Update the admin user to be main_admin
    adminUser.role = "main_admin";
    await adminUser.save();

    console.log(`Successfully set ${adminUser.email} as the main admin.`);
    console.log("Done. You can now log in with the main admin account.");
  } catch (error) {
    console.error("Error setting main admin:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

run();
