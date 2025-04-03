import mongoose from "mongoose";

// Get MongoDB URI from environment variable or use fallback (for development only)
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://tkxstory1:qHK8UOJRzeQ80TUr@cluster0.ilb4woe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

// MongoDB connection options
const options = {
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  serverSelectionTimeoutMS: 10000, // 10 seconds
  maxPoolSize: 10, // Maximum number of sockets
  minPoolSize: 1, // Minimum number of sockets
  maxIdleTimeMS: 30000, // Close sockets after 30 seconds inactivity
  retryWrites: true,
  retryReads: true,
};

async function connectDB() {
  try {
    // If already connected, return
    if (connection.isConnected) {
      console.log("Using existing MongoDB connection");
      return;
    }

    // Connect with connection pooling
    const db = await mongoose.connect(MONGODB_URI, options);

    // Update connection status
    connection.isConnected = db.connections[0].readyState;

    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    // Add connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected, attempting to reconnect...");
      connection.isConnected = 0;
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Reset connection status
    connection.isConnected = 0;
    // Throw error for proper handling in API routes
    throw new Error(
      `Failed to connect to MongoDB: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export default connectDB;
