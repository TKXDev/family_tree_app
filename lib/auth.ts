import Cookies from "js-cookie";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Cookie names
const TOKEN_COOKIE = "token";
const PERSISTENT_LOGIN = "persistent_login";

// Store user data and token in cookies
export const setUserAndToken = (
  user: User,
  token: string,
  rememberMe: boolean = false
) => {
  // Set cookie expiration based on remember me option
  if (rememberMe) {
    // If remember me is checked, set a long expiration (30 days)
    Cookies.set(TOKEN_COOKIE, token, { expires: 30 });
    Cookies.set(PERSISTENT_LOGIN, "true", { expires: 30 });
    // Store user in localStorage for persistent login
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    // If remember me is NOT checked, use session cookies (expire when browser closes)
    Cookies.set(TOKEN_COOKIE, token); // No expires parameter means it's a session cookie
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

// Signup user
export const signup = async (name: string, email: string, password: string) => {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password, role: "user" }),
  });

  return await response.json();
};

// Signin user
export const signin = async (email: string, password: string) => {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return await response.json();
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
