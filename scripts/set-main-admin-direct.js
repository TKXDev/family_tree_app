/**
 * This script will set a specific user as the main_admin
 * in a system with the roles: user, admin, main_admin
 */

// MongoDB connection string
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Email to promote
const EMAIL_TO_PROMOTE = "tkxgames1@gmail.com";

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

    // Find the user by email
    const targetUser = await User.findOne({ email: EMAIL_TO_PROMOTE });

    if (!targetUser) {
      console.log(`No user found with email: ${EMAIL_TO_PROMOTE}`);
      console.log("Please check the email address and ensure the user exists.");
      return;
    }

    console.log(`Found user: ${targetUser.name} (${targetUser.email})`);

    // Check if there's already a main_admin
    const mainAdmin = await User.findOne({ role: "main_admin" });
    if (mainAdmin) {
      console.log(
        `There is already a main admin: ${mainAdmin.name} (${mainAdmin.email})`
      );

      // If the target user is already the main admin
      if (mainAdmin.email === EMAIL_TO_PROMOTE) {
        console.log("This user is already the main admin.");
        return;
      }

      console.log(
        `Will replace the current main admin with ${EMAIL_TO_PROMOTE}`
      );

      // Demote current main admin to admin
      mainAdmin.role = "admin";
      await mainAdmin.save();
      console.log(
        `Previous main admin ${mainAdmin.email} has been demoted to admin.`
      );
    }

    // Update the target user to be main_admin
    targetUser.role = "main_admin";
    await targetUser.save();

    console.log(`Successfully set ${targetUser.email} as the main admin.`);
    console.log("Done. You can now log in with the main admin account.");
  } catch (error) {
    console.error("Error setting main admin:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

// Execute the script
run();
