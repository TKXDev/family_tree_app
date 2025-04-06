/**
 * This script checks and fixes common issues with main_admin role
 * It validates the user's role in the database and local storage
 */

// MongoDB connection string
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Email of user to check
const USER_EMAIL = "tkxgames1@gmail.com";

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

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

// Check if the isMainAdmin function is correctly implemented
function checkAuthLibrary() {
  try {
    // Path to auth.ts file
    const authFilePath = path.join(process.cwd(), "lib", "auth.ts");

    if (fs.existsSync(authFilePath)) {
      const authFileContent = fs.readFileSync(authFilePath, "utf8");

      // Check for isMainAdmin function
      const isMainAdminCheck = authFileContent.includes(
        "export const isMainAdmin = (user?: User | null): boolean => {"
      );
      const correctImplementation = authFileContent.includes(
        'return user?.role === "main_admin";'
      );

      console.log("\nChecking auth library implementation:");
      console.log(
        "- isMainAdmin function exists:",
        isMainAdminCheck ? "✅ Yes" : "❌ No"
      );
      console.log(
        "- isMainAdmin implementation correct:",
        correctImplementation ? "✅ Yes" : "❌ No"
      );

      if (!correctImplementation) {
        console.log(
          "\n⚠️ ISSUE DETECTED: isMainAdmin implementation may be incorrect"
        );
        console.log("Check lib/auth.ts and ensure it contains:");
        console.log(
          "export const isMainAdmin = (user?: User | null): boolean => {"
        );
        console.log('  return user?.role === "main_admin";');
        console.log("};");
      }

      return isMainAdminCheck && correctImplementation;
    } else {
      console.log("❌ Auth library file not found at:", authFilePath);
      return false;
    }
  } catch (error) {
    console.error("Error checking auth library:", error);
    return false;
  }
}

const run = async () => {
  try {
    // Connect to the database
    await connectDB();

    console.log("\n==== MAIN ADMIN CHECK UTILITY ====\n");

    // Find the user by email
    const user = await User.findOne({ email: USER_EMAIL });

    if (!user) {
      console.log(`❌ No user found with email: ${USER_EMAIL}`);
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Role in database: ${user.role}`);

    // Check if the role is correctly set
    const hasCorrectRole = user.role === "main_admin";
    console.log(
      `   Correct main_admin role:`,
      hasCorrectRole ? "✅ Yes" : "❌ No"
    );

    if (!hasCorrectRole) {
      console.log(
        "\n⚠️ ISSUE DETECTED: User does not have main_admin role in database"
      );
      console.log(
        "Would you like to fix this issue? This will update the role to main_admin."
      );
      user.role = "main_admin";
      await user.save();
      console.log("✅ Fixed: User role updated to main_admin");
    }

    // Check tokens
    const tokens = await Token.find({ userId: user._id.toString() });
    console.log(`\n   Active tokens found: ${tokens.length}`);

    if (tokens.length > 0) {
      let hasValidAdminToken = false;

      for (const token of tokens) {
        try {
          const payload = require("jsonwebtoken").decode(token.token);
          console.log(`   Token ID: ${token._id}`);
          console.log(`   - Role in token: ${payload.role}`);
          console.log(`   - Expires: ${token.expires}`);

          if (payload.role === "main_admin") {
            hasValidAdminToken = true;
          }
        } catch (error) {
          console.log(`   - Could not decode token: ${error.message}`);
        }
      }

      if (!hasValidAdminToken) {
        console.log(
          "\n⚠️ ISSUE DETECTED: No valid token with main_admin role found"
        );
        console.log(
          "Run the generate-admin-token.js script to create a new token:"
        );
        console.log("node scripts/generate-admin-token.js");
      } else {
        console.log("\n✅ Valid main_admin token found");
      }
    } else {
      console.log("\n⚠️ ISSUE DETECTED: No active tokens found");
      console.log(
        "Run the generate-admin-token.js script to create a new token:"
      );
      console.log("node scripts/generate-admin-token.js");
    }

    // Check auth library implementation
    const isAuthLibraryCorrect = checkAuthLibrary();

    console.log("\n==== TROUBLESHOOTING INSTRUCTIONS ====");
    console.log("1. Completely log out of the application");
    console.log(
      "2. Clear browser cookies and local storage for localhost:3000"
    );
    console.log(
      "3. Generate a new admin token using: node scripts/generate-admin-token.js"
    );
    console.log("4. Log in using username/password (not token)");
    console.log(
      "5. The server should create a new token with the correct role\n"
    );
  } catch (error) {
    console.error("Error checking main admin status:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

// Execute the script
run();
