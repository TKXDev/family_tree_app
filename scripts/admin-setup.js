/**
 * ADMIN SETUP SCRIPT - One-step solution to set up admin access
 *
 * Usage:
 * node scripts/admin-setup.js <email>
 *
 * Example:
 * node scripts/admin-setup.js tkxgames1@gmail.com
 *
 * Note: After running this script, you can simply log in through the normal sign-in page.
 * Admin tokens are now automatically generated with extended expiry when you log in.
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env.local" });

// Configurable options
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = process.env.ADMIN_TOKEN_EXPIRY || "30d"; // Use admin token expiry from env
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Schema definitions
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isMainAdmin: Boolean,
});

const TokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    expires: { type: Date, required: true },
    isValid: { type: Boolean, default: true },
    type: { type: String, enum: ["auth", "refresh"], default: "auth" },
    source: String,
    userAgent: String,
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

async function setupAdmin() {
  try {
    // Get user email from command line argument
    const email = process.argv[2];
    if (!email) {
      console.error("Please provide an email address:");
      console.error("node scripts/admin-setup.js your-email@example.com");
      process.exit(1);
    }

    console.log("🚀 Starting admin setup for:", email);
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database");

    // Initialize models
    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    const Token = mongoose.models.Token || mongoose.model("Token", TokenSchema);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.error(
        `❌ User with email ${email} not found. Please register first.`
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    // 1. Update user to be admin and main admin
    console.log(`👤 Found user: ${user.name} (${user.email})`);
    user.role = "admin";
    user.isMainAdmin = true;
    await user.save();
    console.log("👑 User promoted to admin");

    // 2. Clear main admin flag from other users
    const result = await User.updateMany(
      { _id: { $ne: user._id } },
      { $set: { isMainAdmin: false } }
    );
    console.log(
      `🧹 Cleaned up main admin flag on ${result.modifiedCount} other users`
    );

    // 3. Generate admin token
    console.log("🔑 Generating authentication token...");

    // Create token payload
    const payload = {
      userId: user._id.toString(),
      name: user.name || "Admin User",
      email: user.email,
      role: "admin",
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Calculate expiry date
    const decoded = jwt.decode(token);
    const expires = new Date(decoded.exp * 1000);

    // Save token to database
    await new Token({
      token,
      userId: user._id,
      expires,
      type: "auth",
      source: "Admin Setup Script",
      userAgent: "CLI",
    }).save();

    console.log("\n✨ ADMIN SETUP COMPLETE ✨");
    console.log("\n🔑 ADMIN PRIVILEGES GRANTED");
    console.log(
      "\n📌 IMPORTANT: You now have two options to access admin features:"
    );

    console.log("\n🔄 OPTION 1: SIMPLY LOG IN (RECOMMENDED)");
    console.log("1. Go to http://localhost:3000/signin");
    console.log("2. Sign in with your credentials");
    console.log(
      "3. The system will automatically generate an admin token for you"
    );
    console.log("4. You're ready to use admin features!");

    console.log("\n🔐 OPTION 2: USE THIS IMMEDIATE TOKEN");
    console.log(
      "If you want to use admin features right away without logging in:"
    );
    console.log("1. Open your browser to http://localhost:3000");
    console.log("2. Press F12 to open developer tools");
    console.log("3. Go to Application tab → Storage → Cookies → localhost");
    console.log("4. Create a new cookie with:");
    console.log("   • Name: admin_token");
    console.log("   • Value: " + token);
    console.log("   • Domain: localhost");
    console.log("   • Path: /");
    console.log(
      "\n⏱️ Token expires:",
      expires.toLocaleDateString(),
      expires.toLocaleTimeString()
    );

    // Create a copy-paste ready cookie command for terminal
    console.log("\n📝 OR WITH CURL (COPY-PASTE):");
    console.log(
      `curl -X POST http://localhost:3000/api/any-endpoint -H "Authorization: Bearer ${token}" -v`
    );

    console.log("\n🎉 Your account now has permanent admin privileges.");
    console.log("Every time you sign in, your admin role will be recognized.");

    await mongoose.disconnect();
    console.log("\n👋 Database connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the script
setupAdmin();
