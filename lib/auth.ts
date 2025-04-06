import Cookies from "js-cookie";
import { z, ZodError } from "zod";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "main_admin";
}

// Cookie names
const TOKEN_COOKIE = "token";
const CLIENT_TOKEN_COOKIE = "client_token";
const ADMIN_TOKEN_COOKIE = "admin_token";
const PERSISTENT_LOGIN = "persistent_login";

// Validation schemas
const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!(getToken() || Cookies.get(PERSISTENT_LOGIN) === "true");
};

// Check if user has persistent login
export const hasPersistentLogin = (): boolean => {
  return Cookies.get(PERSISTENT_LOGIN) === "true";
};

// Get token from cookies
export const getToken = (): string | null => {
  // Try different token cookies
  return (
    Cookies.get(ADMIN_TOKEN_COOKIE) ||
    Cookies.get(CLIENT_TOKEN_COOKIE) ||
    Cookies.get(TOKEN_COOKIE) ||
    null
  );
};

// Get user from storage
export const getUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  // First check sessionStorage
  let userJson = sessionStorage.getItem("user");

  // If not in sessionStorage, check localStorage
  if (!userJson && hasPersistentLogin()) {
    userJson = localStorage.getItem("user");
  }

  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error("Error parsing user data:", e);
    return null;
  }
};

// Save user data to storage
export const saveUserToStorage = (
  user: User,
  rememberMe: boolean = false
): void => {
  // Stringify the user object
  const userJson = JSON.stringify(user);

  if (rememberMe) {
    // For persistent login, save to both storages
    localStorage.setItem("user", userJson);
    sessionStorage.setItem("user", userJson);
  } else {
    // For session-only login, use sessionStorage
    sessionStorage.setItem("user", userJson);
    localStorage.removeItem("user");
  }
};

// Store user data and token in cookies (legacy function for compatibility)
export const setUserAndToken = (
  user: User,
  token: string,
  rememberMe: boolean = false
) => {
  console.log("Legacy setUserAndToken called with:", {
    user: user?.email || "unknown",
    hasToken: !!token,
    rememberMe,
  });

  // Save user to storage using our new function
  saveUserToStorage(user, rememberMe);

  // Just in case this function is called with an actual token, we'll handle it
  if (token && token !== "nextauth_session") {
    // Using the same expiry logic as our signin endpoint
    const cookieOptions = rememberMe
      ? { expires: 30 } // 30 days if remember me
      : {}; // Session cookie if not remember me

    if (user.role === "admin") {
      Cookies.set(ADMIN_TOKEN_COOKIE, token, {
        ...cookieOptions,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }

    Cookies.set(CLIENT_TOKEN_COOKIE, token, {
      ...cookieOptions,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    // Set the httpOnly version in server-side through api call
    fetch("/api/auth/set-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rememberMe }),
      credentials: "include",
    }).catch((err) => {
      console.error("Error setting token via API:", err);
    });
  }

  // Set persistent login cookie if enabled
  if (rememberMe) {
    Cookies.set(PERSISTENT_LOGIN, "true", {
      expires: 30,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  } else {
    Cookies.remove(PERSISTENT_LOGIN);
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    // Call logout API to invalidate tokens on server
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    // Always clean up client-side regardless of server response

    // Remove all cookies
    Cookies.remove(TOKEN_COOKIE);
    Cookies.remove(CLIENT_TOKEN_COOKIE);
    Cookies.remove(ADMIN_TOKEN_COOKIE);
    Cookies.remove(PERSISTENT_LOGIN);

    // Clear storage
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }
};

// Validate email and password
export const validateCredentials = (email: string, password: string) => {
  try {
    emailSchema.parse(email);
    passwordSchema.parse(password);
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((err: z.ZodIssue) => err.message),
      };
    }
    return {
      isValid: false,
      errors: ["An unexpected error occurred"],
    };
  }
};

// Sign in user
export const signin = async (
  email: string,
  password: string,
  rememberMe: boolean = false
) => {
  console.log(`Attempting to sign in: ${email} with rememberMe=${rememberMe}`);

  try {
    // Validate credentials
    const validation = validateCredentials(email, password);
    if (!validation.isValid) {
      return {
        error: "Validation failed",
        details: validation.errors,
      };
    }

    // Make API request
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, rememberMe }),
      credentials: "include", // Important: Send cookies with request
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Signin failed");
    }

    console.log("Login successful, response:", data);

    // We need to manually check for token in the cookies
    // because it may not be accessible via JavaScript if httpOnly is true
    const clientToken = Cookies.get(CLIENT_TOKEN_COOKIE);
    const adminToken = Cookies.get(ADMIN_TOKEN_COOKIE);

    console.log("Client-accessible tokens:", {
      hasClientToken: !!clientToken,
      hasAdminToken: !!adminToken,
    });

    // Save user data to storage
    if (data.user) {
      saveUserToStorage(data.user, rememberMe);
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: error instanceof Error ? error.message : "Signin failed",
      details: error instanceof Error ? error.stack : undefined,
    };
  }
};

// Check if user has a specific role
export const hasRole = (requiredRole: string): boolean => {
  const user = getUser();
  return user?.role === requiredRole;
};

// Check if user is an admin
export const isAdmin = (user?: User | null): boolean => {
  return user?.role === "admin" || user?.role === "main_admin";
};

export const isMainAdmin = (user?: User | null): boolean => {
  return user?.role === "main_admin";
};

export const canManageMembers = (user?: User | null): boolean => {
  return isAdmin(user);
};

export const canPromoteToAdmin = (user?: User | null): boolean => {
  return isMainAdmin(user);
};
