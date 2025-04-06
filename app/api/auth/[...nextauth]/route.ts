import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "user" | "admin" | "main_admin";
    };
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    role?: "user" | "admin" | "main_admin";
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "user" | "admin" | "main_admin";
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        try {
          const user = await User.findOne({ email: credentials.email });
          if (!user) return null;

          const isValid = await user.comparePassword(credentials.password);
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Error in NextAuth authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user data to the token when first signed in
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }

      // For Google sign-in, check if a user with the email exists
      // If not, create a new user
      if (account?.provider === "google" && user?.email) {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            role: "user",
            // Set a random password or mark as oauth user
            password:
              Math.random().toString(36).slice(2) +
              Math.random().toString(36).slice(2),
          });
          token.userId = newUser._id.toString();
          token.role = "user";
        } else {
          token.userId = existingUser._id.toString();
          token.role = existingUser.role;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }
      if (session.user && token.role) {
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Force redirect to dashboard for all sign-ins
      if (
        url.includes("/signin") ||
        url.includes("/signup") ||
        url.includes("/callback") ||
        url.includes("/api/auth")
      ) {
        return `${baseUrl}/dashboard`;
      }

      // For any other URL on the same origin, allow it
      if (
        url.startsWith(baseUrl) ||
        url.startsWith("/") ||
        new URL(url).origin === baseUrl
      ) {
        return url;
      }

      // Default to the base URL
      return baseUrl;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
