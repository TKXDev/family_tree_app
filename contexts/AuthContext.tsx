"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  User,
  getUser,
  isAuthenticated,
  logout as authLogout,
  hasPersistentLogin,
  signin,
  setUserAndToken,
  saveUserToStorage,
  isAdmin,
  isMainAdmin,
  canManageMembers,
  canPromoteToAdmin,
} from "@/lib/auth";
import { useSession, signOut } from "next-auth/react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

interface Session {
  id: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  userAgent: string;
  isCurrentSession: boolean;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isPersistentLogin: boolean | null;
  logout: () => Promise<void>;
  checkAndSetAuth: () => Promise<boolean>;
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<User>;
  signOut: () => Promise<void>;
  getSessions: () => Promise<Session[]>;
  sessions: Session[];
  sessionsLoading: boolean;
  terminateSession: (sessionId: string) => Promise<boolean>;
  terminateAllOtherSessions: () => Promise<boolean>;
  isAdmin: boolean;
  isMainAdmin: boolean;
  canManageMembers: boolean;
  canPromoteToAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  isLoggedIn: false,
  isPersistentLogin: null,
  logout: async () => {},
  checkAndSetAuth: async () => false,
  signIn: async () => ({ _id: "", name: "", email: "", role: "" }),
  signOut: async () => {},
  getSessions: async () => [],
  sessions: [],
  sessionsLoading: false,
  terminateSession: async () => false,
  terminateAllOtherSessions: async () => false,
  isAdmin: false,
  isMainAdmin: false,
  canManageMembers: false,
  canPromoteToAdmin: false,
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

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Get all active sessions for the current user
  const getSessions = useCallback(async () => {
    if (!user) return [];

    try {
      setSessionsLoading(true);
      const response = await fetch("/api/auth/sessions");
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data.sessions);
      return data.sessions;
    } catch (error) {
      console.error("Failed to get sessions:", error);
      toast.error("Failed to load sessions");
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  // Terminate a specific session
  const terminateSession = useCallback(
    async (sessionId: string) => {
      try {
        const response = await fetch(`/api/auth/sessions?id=${sessionId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to terminate session");
        toast.success("Session terminated successfully");
        await getSessions(); // Refresh sessions list
        return true;
      } catch (error) {
        console.error("Failed to terminate session:", error);
        toast.error("Failed to terminate session");
        return false;
      }
    },
    [getSessions]
  );

  // Terminate all other sessions
  const terminateAllOtherSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/sessions?all=true", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to terminate sessions");
      toast.success("All other sessions terminated successfully");
      await getSessions(); // Refresh sessions list
      return true;
    } catch (error) {
      console.error("Failed to terminate sessions:", error);
      toast.error("Failed to terminate sessions");
      return false;
    }
  }, [getSessions]);

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
      const userChanged = JSON.stringify(userData) !== JSON.stringify(user);
      const loginStatusChanged = isUserLoggedIn !== isLoggedIn;
      const persistentLoginChanged = persistentLogin !== isPersistentLogin;

      // Update states individually only if they changed
      if (loginStatusChanged) {
        setIsLoggedIn(isUserLoggedIn);
      }

      if (persistentLoginChanged) {
        setIsPersistentLogin(persistentLogin || nextAuthLoggedIn);
      }

      if (userChanged && userData) {
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
      // Always ensure loading is set to false after check completes
      if (loading) {
        setLoading(false);
      }
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [isRedirecting, session, status, loading, isInitialized]);

  // Update auth when NextAuth session changes
  useEffect(() => {
    if (status !== "loading") {
      // Use a flag to avoid recursive updates
      const runCheck = async () => {
        await checkAndSetAuth();
      };
      runCheck();
    }
  }, [session, status]); // Remove checkAndSetAuth from dependencies

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
    } else if (status !== "loading" && loading) {
      // Ensure loading is false when NextAuth is done loading
      setLoading(false);
    }
  }, [isInitialized, isRedirecting, status, loading]); // Remove checkAndSetAuth

  // Event listeners for focus
  useEffect(() => {
    // Check auth on focus (user might have logged out in another tab)
    const handleFocus = () => {
      if (!isRedirecting && isInitialized) {
        const runCheck = async () => {
          await checkAndSetAuth();
        };
        runCheck();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isRedirecting, isInitialized]); // Remove checkAndSetAuth dependency

  const handleLogout = useCallback(async (): Promise<void> => {
    // Prevent multiple logout attempts
    if (isRedirecting) return;

    // Set loading and redirection flags to prevent race conditions
    setLoading(true);
    setIsRedirecting(true);

    try {
      console.log("Starting logout process...");

      // Call the server-side logout endpoint first
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        console.log("Logout API response status:", response.status);
      } catch (apiError) {
        console.error("Error calling logout API:", apiError);
        // Continue with client-side logout even if API call fails
      }

      // Local logout
      authLogout();

      // Also sign out from NextAuth if session exists
      if (session) {
        await signOut({ redirect: false });
      }

      // Clear state
      setUser(null);
      setIsLoggedIn(false);
      setIsPersistentLogin(false);

      // Force redirect to signin page
      console.log("Redirecting to signin page...");
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);
      setIsRedirecting(false);
      setLoading(false);

      // Try direct redirect as fallback
      window.location.href = "/signin";
    }
  }, [router, isRedirecting, session]);

  // Calculate admin status values on user change
  const userIsAdmin = useMemo(() => isAdmin(user), [user]);
  const userIsMainAdmin = useMemo(() => isMainAdmin(user), [user]);
  const userCanManageMembers = useMemo(() => canManageMembers(user), [user]);
  const userCanPromoteToAdmin = useMemo(() => canPromoteToAdmin(user), [user]);

  // Build context value with all updated status
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn,
      isPersistentLogin,
      logout: handleLogout,
      checkAndSetAuth,
      signIn: async (email: string, password: string, rememberMe?: boolean) => {
        try {
          const result = await signin(email, password, !!rememberMe);
          await checkAndSetAuth();
          return {
            _id: result.user._id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role as "user" | "admin" | "main_admin",
          };
        } catch (error) {
          throw error;
        }
      },
      signOut: handleLogout,
      getSessions,
      sessions,
      sessionsLoading,
      terminateSession,
      terminateAllOtherSessions,
      isAdmin: userIsAdmin,
      isMainAdmin: userIsMainAdmin,
      canManageMembers: userCanManageMembers,
      canPromoteToAdmin: userCanPromoteToAdmin,
    }),
    [
      user,
      loading,
      status,
      isInitialized,
      isLoggedIn,
      isPersistentLogin,
      handleLogout,
      checkAndSetAuth,
      userIsAdmin,
      userIsMainAdmin,
      userCanManageMembers,
      userCanPromoteToAdmin,
      getSessions,
      sessions,
      sessionsLoading,
      terminateSession,
      terminateAllOtherSessions,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
