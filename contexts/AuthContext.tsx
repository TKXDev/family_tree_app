"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  User,
  getUser,
  isAuthenticated,
  logout as authLogout,
  hasPersistentLogin,
} from "@/lib/auth";
import { useSession, signOut } from "next-auth/react";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isPersistentLogin: boolean | null;
  logout: () => Promise<void>;
  checkAndSetAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  isLoggedIn: false,
  isPersistentLogin: null,
  logout: async () => {},
  checkAndSetAuth: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPersistentLogin, setIsPersistentLogin] = useState<boolean | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Get NextAuth session
  const { data: session, status } = useSession();

  // This function can be called to check and update authentication status
  const checkAndSetAuth = useCallback(async (): Promise<boolean> => {
    try {
      // Prevent any actions if already redirecting
      if (isRedirecting) return isLoggedIn;

      // Check traditional auth
      const localLoggedIn = isAuthenticated();
      const persistentLogin = hasPersistentLogin();
      let userData = getUser();

      // Check NextAuth session
      const nextAuthLoggedIn = status === "authenticated" && !!session?.user;

      // NextAuth user takes precedence if available
      if (nextAuthLoggedIn && session?.user) {
        userData = {
          _id: session.user.id || "",
          name: session.user.name || "",
          email: session.user.email || "",
          role: (session.user as any).role || "user",
        };
      }

      const isUserLoggedIn = localLoggedIn || nextAuthLoggedIn;

      // Only update state if there's been an actual change
      if (
        isUserLoggedIn !== isLoggedIn ||
        persistentLogin !== isPersistentLogin ||
        JSON.stringify(userData) !== JSON.stringify(user)
      ) {
        setIsLoggedIn(isUserLoggedIn);
        setIsPersistentLogin(persistentLogin || nextAuthLoggedIn);
        setUser(userData);
      }

      return isUserLoggedIn;
    } catch (error) {
      console.error("Auth check error:", error);
      setIsLoggedIn(false);
      setIsPersistentLogin(false);
      setUser(null);
      return false;
    } finally {
      if (!isInitialized) {
        setIsInitialized(true);
      }
      setLoading(false);
    }
  }, [
    isLoggedIn,
    isPersistentLogin,
    isRedirecting,
    user,
    isInitialized,
    session,
    status,
  ]);

  // Update auth when NextAuth session changes
  useEffect(() => {
    if (status !== "loading") {
      checkAndSetAuth();
    }
  }, [session, status, checkAndSetAuth]);

  // Initial auth check
  useEffect(() => {
    // Initial auth check with delay to ensure cookies are loaded
    const initialCheck = async () => {
      try {
        // Set a longer initial timeout to ensure browser has fully loaded cookies
        await new Promise((resolve) => setTimeout(resolve, 300));
        await checkAndSetAuth();
      } catch (error) {
        console.error("Initial auth check failed:", error);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    if (!isInitialized && !isRedirecting && status !== "loading") {
      initialCheck();
    }
  }, [checkAndSetAuth, isInitialized, isRedirecting, status]);

  // Event listeners for focus
  useEffect(() => {
    // Check auth on focus (user might have logged out in another tab)
    const handleFocus = () => {
      if (!isRedirecting && isInitialized) {
        checkAndSetAuth();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAndSetAuth, isRedirecting, isInitialized]);

  const handleLogout = useCallback(async (): Promise<void> => {
    // Prevent multiple logout attempts
    if (isRedirecting) return;

    // Set loading and redirection flags to prevent race conditions
    setLoading(true);
    setIsRedirecting(true);

    try {
      // Logout from both systems
      authLogout();

      // Also sign out from NextAuth if session exists
      if (session) {
        await signOut({ redirect: false });
      }

      setUser(null);
      setIsLoggedIn(false);
      setIsPersistentLogin(false);

      // Use a small timeout to ensure cookies are cleared before redirect
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          router.push("/signin");
          // Keep redirecting flag on until next render cycle to prevent loops
          setTimeout(() => {
            setIsRedirecting(false);
            setLoading(false);
            resolve();
          }, 500);
        }, 100);
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsRedirecting(false);
      setLoading(false);
    }
  }, [router, isRedirecting, session]);

  const contextValue = {
    user,
    loading: loading || status === "loading" || !isInitialized,
    isLoggedIn,
    isPersistentLogin,
    logout: handleLogout,
    checkAndSetAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
