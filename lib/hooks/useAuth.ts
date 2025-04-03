import { useCallback, useState, useEffect } from "react";
import { useApi } from "./useApi";
import { authApi, User } from "../api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Simple function to decode JWT token without external libraries
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

export function useAuth() {
  const router = useRouter();
  const { execute: apiExecute, loading, error, data: user } = useApi<User>();
  const [isAdmin, setIsAdmin] = useState(false);

  // Update isAdmin state whenever user changes
  useEffect(() => {
    if (user && user.role) {
      console.log("User role from API:", user.role);
      setIsAdmin(user.role === "admin");
    } else {
      // Check localStorage token as backup
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = parseJwt(token);
          if (decoded && decoded.role) {
            console.log("User role from token:", decoded.role);
            setIsAdmin(decoded.role === "admin");
          } else {
            console.log("No role in token or invalid token");
            setIsAdmin(false);
          }
        } else {
          console.log("No token in localStorage");
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setIsAdmin(false);
      }
    }
  }, [user]);

  const getCurrentUser = useCallback(async () => {
    try {
      const userData = await apiExecute(() => authApi.getCurrentUser());
      console.log("Current user data:", userData);
      return userData as User;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }, [apiExecute]);

  useEffect(() => {
    // Get current user on mount
    getCurrentUser();
  }, [getCurrentUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const userData = await apiExecute(() =>
          authApi.signIn(email, password)
        );
        const signedInUser = userData as User;

        // Store token in localStorage
        if (signedInUser.token) {
          localStorage.setItem("token", signedInUser.token);
          // Set token in cookie for API requests
          document.cookie = `token=${signedInUser.token}; path=/; max-age=86400; SameSite=Strict`;

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
      await apiExecute(() => authApi.signOut());
      localStorage.removeItem("token");
      router.push("/");
    } catch (error) {
      throw error;
    }
  }, [apiExecute, router]);

  return {
    user,
    isAdmin,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    getCurrentUser,
  };
}
