// Direct MongoDB query script to set a user as admin
// This script uses the native MongoDB driver and doesn't rely on mongoose models

const { MongoClient, ObjectId } = require("mongodb");

// CONFIGURATION - CHANGE THESE VALUES
const EMAIL_TO_MAKE_ADMIN = "tkxgames1@gmail.com"; // CHANGE THIS TO YOUR EMAIL
const MONGODB_URI =
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // CHANGE THIS TO YOUR CONNECTION STRING
const DB_NAME = "test"; // Change if your database has a different name

async function setAdminDirectly() {
  console.log(`Setting up ${EMAIL_TO_MAKE_ADMIN} as admin and main admin...`);

  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);
    const usersCollection = db.collection("users");

    // Find the user by email
    const user = await usersCollection.findOne({ email: EMAIL_TO_MAKE_ADMIN });

    if (!user) {
      console.error(`No user found with email: ${EMAIL_TO_MAKE_ADMIN}`);
      console.error(
        "Please check the email address and make sure the user exists in the database"
      );
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);

    // Update the user to be admin and main admin
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { role: "admin", isMainAdmin: true } }
    );

    console.log(`Updated user. ModifiedCount: ${updateResult.modifiedCount}`);

    // Clear main admin flag from all other users
    const clearResult = await usersCollection.updateMany(
      { _id: { $ne: user._id } },
      { $set: { isMainAdmin: false } }
    );

    console.log(
      `Cleared main admin flag from ${clearResult.modifiedCount} other users`
    );
    console.log(
      "Done! You can now log in with this user and have full admin privileges."
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the script
setAdminDirectly();
