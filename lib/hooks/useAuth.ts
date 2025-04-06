import { useCallback, useState, useEffect } from "react";
import { useApi } from "./useApi";
import { authApi, User } from "../api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";
import { isAdmin as checkIsAdmin } from "@/lib/auth";

// Simple function to decode JWT token without external libraries
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

export interface Session {
  id: string;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  userAgent: string;
  isCurrentSession: boolean;
}

export function useAuth() {
  const router = useRouter();
  const { execute: apiExecute, loading, error, data: user } = useApi<User>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Effect to update isAdmin state whenever user changes
  useEffect(() => {
    if (user) {
      setIsAdmin(checkIsAdmin(user));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Token refresh function
  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post("/api/auth/refresh");
      if (response.data) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }, []);

  // Check token expiration and refresh if needed
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp) {
        // Current time in seconds
        const currentTime = Math.floor(Date.now() / 1000);

        // If token expires in less than 5 minutes (300 seconds)
        if (decoded.exp - currentTime < 300) {
          refreshToken();
        }

        // Set up a timer to refresh token before it expires
        const timeUntilExpiry = (decoded.exp - currentTime - 300) * 1000; // Convert to ms
        if (timeUntilExpiry > 0) {
          const refreshTimer = setTimeout(() => {
            refreshToken();
          }, timeUntilExpiry);

          return () => clearTimeout(refreshTimer);
        }
      }
    }
  }, [refreshToken]);

  const getCurrentUser = useCallback(async () => {
    try {
      const userData = await apiExecute(() => authApi.getCurrentUser());
      console.log("Current user data:", userData);
      return userData as User;
    } catch (error) {
      console.error("Error getting current user:", error);

      // Try to refresh token if the error is 401 (Unauthorized)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          // Try again after refreshing token
          return await apiExecute(() => authApi.getCurrentUser());
        }
      }

      return null;
    }
  }, [apiExecute, refreshToken]);

  useEffect(() => {
    // Get current user on mount
    getCurrentUser();
  }, [getCurrentUser]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        const userData = await apiExecute(() =>
          authApi.signIn(email, password, rememberMe)
        );
        const signedInUser = userData as User;

        // Store token in localStorage
        if (signedInUser.token) {
          localStorage.setItem("token", signedInUser.token);

          // Also store whether this is a persistent login
          if (rememberMe) {
            localStorage.setItem("persistent_login", "true");
          } else {
            localStorage.removeItem("persistent_login");
          }

          // Check role immediately
          const decoded = parseJwt(signedInUser.token);
          if (decoded && decoded.role) {
            console.log("User role from sign-in token:", decoded.role);
            setIsAdmin(decoded.role === "admin");
          }
        }

        toast.success("Successfully signed in!");
        router.push("/dashboard");
        return signedInUser;
      } catch (error) {
        console.error("Sign in error:", error);
        toast.error("Failed to sign in. Please check your credentials.");
        throw error;
      }
    },
    [apiExecute, router]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const userData = await apiExecute(() =>
          authApi.signUp(email, password, name)
        );
        const newUser = userData as User;

        if (newUser.token) {
          localStorage.setItem("token", newUser.token);
        }

        router.push("/dashboard");
        return newUser;
      } catch (error) {
        throw error;
      }
    },
    [apiExecute, router]
  );

  const signOut = useCallback(async () => {
    try {
      // Call the API to handle server-side logout
      await apiExecute(() => authApi.signOut());

      // Clear all client-side auth data
      localStorage.removeItem("token");
      localStorage.removeItem("persistent_login");

      // Clear potential cookies that might be keeping the session alive
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Use both router and window.location for more reliable redirect
      router.push("/signin");

      // For extra safety, force a complete page reload and redirect after a small delay
      setTimeout(() => {
        window.location.href = "/signin";
      }, 100);
    } catch (error) {
      console.error("Logout error:", error);

      // Even if there's an error, try to force logout
      localStorage.clear();
      window.location.href = "/signin";
      throw error;
    }
  }, [apiExecute, router]);

  // Get all active sessions for the current user
  const getSessions = useCallback(async () => {
    if (!user) return [];

    try {
      setSessionsLoading(true);
      const response = await axios.get("/api/auth/sessions");
      setSessions(response.data.sessions);
      return response.data.sessions;
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
        await axios.delete(`/api/auth/sessions?id=${sessionId}`);
        toast.success("Session terminated successfully");

        // Refresh the sessions list
        getSessions();
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
      await axios.delete("/api/auth/sessions?all=true");
      toast.success("All other sessions terminated successfully");

      // Refresh the sessions list
      getSessions();
      return true;
    } catch (error) {
      console.error("Failed to terminate sessions:", error);
      toast.error("Failed to terminate sessions");
      return false;
    }
  }, [getSessions]);

  return {
    user,
    isAdmin,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    sessions,
    sessionsLoading,
    getSessions,
    terminateSession,
    terminateAllOtherSessions,
    refreshToken,
  };
}
