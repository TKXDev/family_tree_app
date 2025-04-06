import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { saveUserToStorage } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "./auth";
import Cookies from "js-cookie";

/**
 * Hook that integrates NextAuth sessions with our custom auth system.
 * This ensures that when a user logs in with Google OAuth via NextAuth,
 * our existing AuthContext also reflects that authenticated state.
 */
export function useNextAuthIntegration() {
  const { data: session, status } = useSession();
  const { checkAndSetAuth, isLoggedIn, user } = useAuth();

  useEffect(() => {
    // If user is logged in with NextAuth but not with our custom system
    if (status === "authenticated" && session?.user && !isLoggedIn) {
      // Extract user information from NextAuth session
      const { id, name, email, role } = session.user as {
        id?: string;
        name?: string | null;
        email?: string | null;
        role?: string;
      };

      if (id && email) {
        // Map NextAuth user to our user format
        const authUser = {
          _id: id,
          name: name || email.split("@")[0],
          email: email,
          role: (role || "user") as "user" | "admin" | "main_admin",
        };

        // Save user to storage (persistent)
        saveUserToStorage(authUser, true);

        // Mark this as a NextAuth session
        Cookies.set("nextauth_integration", "true", {
          expires: 30,
        });

        // Force update our auth context
        checkAndSetAuth();
      }
    }

    // If user is logged out of NextAuth but still logged in with our system
    // And the logged in user was created via NextAuth
    if (
      status === "unauthenticated" &&
      isLoggedIn &&
      (user?._id?.startsWith("oauth_") ||
        Cookies.get("nextauth_integration") === "true")
    ) {
      // Log out from our custom system
      signOut({ redirect: false });
    }
  }, [status, session, isLoggedIn, user, checkAndSetAuth]);

  return {
    isNextAuthAuthenticated: status === "authenticated",
    nextAuthLoading: status === "loading",
    nextAuthUser: session?.user,
  };
}

export const getUserFromSession = (session: {
  user?: Record<string, unknown>;
}): User | null => {
  if (!session?.user) {
    return null;
  }

  return {
    _id: (session.user.id as string) || "",
    name: (session.user.name as string) || "",
    email: (session.user.email as string) || "",
    role: ((session.user.role as string) || "user") as
      | "user"
      | "admin"
      | "main_admin",
  };
};
