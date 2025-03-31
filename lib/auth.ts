import Cookies from "js-cookie";
import { z, ZodError } from "zod";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Cookie names
const TOKEN_COOKIE = "token";
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

// Store user data and token in cookies
export const setUserAndToken = (
  user: User,
  token: string,
  rememberMe: boolean = false
) => {
  // Set cookie expiration based on remember me option
  if (rememberMe) {
    // If remember me is checked, set a long expiration (30 days)
    Cookies.set(TOKEN_COOKIE, token, {
      expires: 30,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    Cookies.set(PERSISTENT_LOGIN, "true", {
      expires: 30,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    // Store user in localStorage for persistent login
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    // If remember me is NOT checked, use session cookies (expire when browser closes)
    Cookies.set(TOKEN_COOKIE, token, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    Cookies.remove(PERSISTENT_LOGIN);
    // For session-only login, store user in sessionStorage instead of localStorage
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.removeItem("user"); // Clear any previous persistent user data
  }
};

// Get user from storage (checking both session and persistent storage)
export const getUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  // First check sessionStorage (for current session)
  let user = sessionStorage.getItem("user");

  // If not in sessionStorage, check localStorage (for persistent login)
  if (!user && hasPersistentLogin()) {
    user = localStorage.getItem("user");
  }

  return user ? JSON.parse(user) : null;
};

// Get token from cookies
export const getToken = (): string | null => {
  return Cookies.get(TOKEN_COOKIE) || null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Check if user has persistent login
export const hasPersistentLogin = (): boolean => {
  return Cookies.get(PERSISTENT_LOGIN) === "true";
};

// Logout user
export const logout = () => {
  Cookies.remove(TOKEN_COOKIE);
  Cookies.remove(PERSISTENT_LOGIN);
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
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

// Signup user
export const signup = async (name: string, email: string, password: string) => {
  // Validate credentials first
  const validation = validateCredentials(email, password);
  if (!validation.isValid) {
    return {
      error: "Validation failed",
      details: validation.errors,
    };
  }

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role: "user" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Signup failed");
    }

    return data;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Signup failed",
      details: error instanceof Error ? error.stack : undefined,
    };
  }
};

// Signin user
export const signin = async (email: string, password: string) => {
  // Validate credentials first
  const validation = validateCredentials(email, password);
  if (!validation.isValid) {
    return {
      error: "Validation failed",
      details: validation.errors,
    };
  }

  try {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Signin failed");
    }

    return data;
  } catch (error) {
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
export const isAdmin = (): boolean => {
  return hasRole("admin");
};
