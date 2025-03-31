import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { setUserAndToken, getUser } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "./auth";

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
          role: role || "user",
        };

        // Save user and token to our custom auth system
        // Using a placeholder token since NextAuth handles the actual session
        setUserAndToken(authUser, "nextauth_session", true);

        // Force update our auth context
        checkAndSetAuth();
      }
    }

    // If user is logged out of NextAuth but still logged in with our system
    // And the logged in user was created via NextAuth
    if (
      status === "unauthenticated" &&
      isLoggedIn &&
      user?._id.startsWith("oauth_")
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

export const getUserFromSession = (session: any): User | null => {
  if (!session?.user) {
    return null;
  }

  return {
    _id: session.user.id || "",
    name: session.user.name || "",
    email: session.user.email || "",
    role: (session.user as any).role || "user",
  };
};
