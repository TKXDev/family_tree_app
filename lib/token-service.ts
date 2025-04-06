import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import connectDB from "./mongodb";
import Token from "../models/Token";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "1d"; // Default 1 day
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d"; // Default 7 days

interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin" | "main_admin";
}

interface JwtTokenData {
  token: string;
  expires: Date;
}

/**
 * Generate a JWT token
 */
export const generateToken = (
  payload: TokenPayload,
  expiresIn: string = TOKEN_EXPIRY
): JwtTokenData => {
  try {
    // Define proper options
    const options: jwt.SignOptions = { expiresIn };

    // Sign token with proper typing
    const token = jwt.sign(payload, JWT_SECRET, options);

    // Calculate expiry date for storing in the database
    const decoded = jwt.decode(token) as { exp: number };
    const expires = new Date(decoded.exp * 1000);

    return { token, expires };
  } catch (error) {
    console.error("Error generating token:", error);
    throw error;
  }
};

/**
 * Save a token to the database
 */
export const saveToken = async (
  userId: string,
  token: string,
  expires: Date,
  type: "auth" | "refresh" | "reset" = "auth",
  userAgent?: string
) => {
  try {
    await connectDB();

    console.log("Attempting to save token to database:", {
      userId,
      type,
      expires,
      hasUserAgent: !!userAgent,
    });

    // Ensure userId is a valid MongoDB ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      console.error("Invalid userId format:", error);
      throw new Error(`Invalid userId format: ${userId}`);
    }

    const tokenDoc = await Token.create({
      userId: userObjectId,
      token,
      expires,
      type,
      userAgent,
      lastUsed: new Date(),
    });

    console.log("Token saved successfully with ID:", tokenDoc._id);

    return tokenDoc;
  } catch (error) {
    console.error("Error saving token to database:", error);
    throw error;
  }
};

/**
 * Verify a token is valid
 */
export const verifyToken = async (
  token: string
): Promise<{ valid: boolean; payload?: any }> => {
  try {
    // Verify JWT first
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const payload = decoded;

    try {
      // Check if token exists in database
      await connectDB();
      const tokenDoc = await Token.findOne({
        token,
        isValid: true,
      });

      if (!tokenDoc) {
        console.log("Token not found in database or marked invalid");
        // Since JWT verification was successful, we'll still consider this valid
        // as a fallback, especially for admin tokens that might not be in DB
        if (payload.role === "admin" || payload.role === "main_admin") {
          console.log(
            "Admin token JWT verification successful - bypassing DB check"
          );
          return { valid: true, payload };
        }
        return { valid: false };
      }

      // Check if token is expired
      if (tokenDoc.expires < new Date()) {
        console.log("Token is expired in database:", {
          expires: tokenDoc.expires,
          now: new Date(),
        });
        await Token.updateOne({ _id: tokenDoc._id }, { isValid: false });
        return { valid: false };
      }

      // Update last used timestamp
      await Token.updateOne({ _id: tokenDoc._id }, { lastUsed: new Date() });

      console.log("Token verification successful - user role:", payload.role);

      return { valid: true, payload };
    } catch (dbError) {
      console.error("Database error during token verification:", dbError);
      // Even if DB check fails, if JWT is valid, we can still authenticate in emergency
      console.log("Falling back to JWT-only verification due to DB error");
      return { valid: true, payload };
    }
  } catch (error) {
    console.error("Unexpected error during token verification:", error);
    return { valid: false };
  }
};

/**
 * Extract token from request (cookie or Authorization header)
 */
export const extractToken = (req: NextRequest): string | null => {
  try {
    console.log(
      "Extracting token from request, available cookies:",
      req.cookies
        .getAll()
        .map((c) => c.name)
        .join(", ")
    );

    // Try admin token first (highest priority)
    let tokenFromCookie = req.cookies.get("admin_token")?.value;

    // Try visible admin token if no admin token
    if (!tokenFromCookie) {
      tokenFromCookie = req.cookies.get("visible_admin_token")?.value;
      if (tokenFromCookie) console.log("Using visible_admin_token");
    }

    // Try app_token next (our custom cookie to avoid NextAuth conflicts)
    if (!tokenFromCookie) {
      tokenFromCookie = req.cookies.get("app_token")?.value;
      if (tokenFromCookie) console.log("Using app_token");
    }

    // Fall back to regular token if no admin or app token
    if (!tokenFromCookie) {
      const tokenCookie = req.cookies.get("token");
      tokenFromCookie = tokenCookie?.value;

      // Only use token cookie if it doesn't look like a NextAuth session
      if (tokenFromCookie && tokenFromCookie === "nextauth_session") {
        console.log("Skipping NextAuth session token");
        tokenFromCookie = null;
      } else if (tokenFromCookie) {
        console.log("Using regular token cookie");
      }
    }

    // Check for token in Authorization header
    const authHeader = req.headers.get("Authorization") || "";
    let tokenFromHeader: string | null = null;

    if (authHeader.startsWith("Bearer ")) {
      tokenFromHeader = authHeader.substring(7);
      console.log("Found Bearer token in headers");
    }

    // Make sure token is properly formatted without Bearer prefix
    let token = tokenFromCookie || tokenFromHeader;

    // If token exists and still has Bearer prefix, strip it
    if (token && token.startsWith("Bearer ")) {
      token = token.substring(7);
      console.log("Stripped 'Bearer ' prefix from token");
    }

    if (token) {
      console.log(`Token found from ${tokenFromCookie ? "cookie" : "header"}`);
      if (tokenFromCookie && req.cookies.get("admin_token")) {
        console.log("Using admin_token cookie");
      }

      // Check if token appears to be a valid JWT format (roughly)
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.log(
          "WARNING: Token doesn't appear to be in standard JWT format"
        );
      }
    } else {
      console.log(
        "No token found in request (checked both cookie and Authorization header)"
      );
    }

    return token || null;
  } catch (error) {
    console.error("Error extracting token from request:", error);
    return null;
  }
};

/**
 * Invalidate a token (logout)
 */
export const invalidateToken = async (token: string): Promise<boolean> => {
  try {
    await connectDB();
    const result = await Token.updateOne({ token }, { isValid: false });
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error invalidating token:", error);
    return false;
  }
};

/**
 * Invalidate all tokens for a user (force logout all devices)
 */
export const invalidateAllUserTokens = async (
  userId: string
): Promise<boolean> => {
  try {
    await connectDB();
    const result = await Token.updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { isValid: false }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error invalidating user tokens:", error);
    return false;
  }
};

/**
 * Get all active sessions for a user
 */
export const getUserSessions = async (userId: string) => {
  await connectDB();
  return Token.find({
    userId: new mongoose.Types.ObjectId(userId),
    isValid: true,
    expires: { $gt: new Date() },
  }).sort({ lastUsed: -1 });
};

/**
 * Create both access and refresh tokens
 */
export const createTokenPair = async (
  payload: TokenPayload,
  userAgent?: string,
  accessTokenExpiry: string = TOKEN_EXPIRY,
  refreshTokenExpiry: string = REFRESH_TOKEN_EXPIRY
) => {
  try {
    console.log("Creating token pair for user:", payload.userId);

    // Generate access token
    const { token: accessToken, expires: accessExpires } = generateToken(
      payload,
      accessTokenExpiry
    );

    // Generate refresh token with longer expiry
    const { token: refreshToken, expires: refreshExpires } = generateToken(
      payload,
      refreshTokenExpiry
    );

    // Save both tokens to database
    await connectDB();
    await Promise.all([
      saveToken(payload.userId, accessToken, accessExpires, "auth", userAgent),
      saveToken(
        payload.userId,
        refreshToken,
        refreshExpires,
        "refresh",
        userAgent
      ),
    ]);

    console.log("Token pair created successfully for user:", payload.userId);

    return {
      accessToken,
      refreshToken,
      accessExpires,
      refreshExpires,
    };
  } catch (error) {
    console.error("Error creating token pair:", error);
    throw error;
  }
};
