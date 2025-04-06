import mongoose from "mongoose";

export interface IToken extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
  userAgent?: string;
  lastUsed?: Date;
}

const TokenSchema = new mongoose.Schema<IToken>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["auth", "refresh", "reset"],
      default: "auth",
    },
    expires: {
      type: Date,
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    userAgent: {
      type: String,
    },
    lastUsed: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
TokenSchema.index({ token: 1 });
TokenSchema.index({ userId: 1, type: 1 });
TokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired tokens

// Check if model exists before creating
const TokenModel =
  mongoose.models.Token || mongoose.model<IToken>("Token", TokenSchema);

// Force model registration
if (!mongoose.models.Token) {
  mongoose.model<IToken>("Token", TokenSchema);
  console.log("Token model registered with MongoDB");
}

export default TokenModel;
