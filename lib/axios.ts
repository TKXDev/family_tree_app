import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This ensures cookies are sent with requests
});

// Add a request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get the token from cookies
    const token = Cookies.get("token");

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;

      // Log the token being sent (only first few characters for security)
      if (token.length > 10) {
        console.log(
          `Request to ${config.url}: Token attached (${token.substring(
            0,
            10
          )}...)`
        );
      }
    } else {
      console.log(`Request to ${config.url}: No token found in cookies`);
    }

    return config;
  },
  (error: any) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests to admin endpoints for debugging
    if (
      response.config.url?.includes("/api/members") &&
      (response.config.method === "post" ||
        response.config.method === "put" ||
        response.config.method === "delete")
    ) {
      console.log(
        `Admin API success: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`
      );
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config?.url || "unknown";
      const requestMethod = error.config?.method?.toUpperCase() || "unknown";

      console.error(
        `API Error ${status} on ${requestMethod} ${requestUrl}:`,
        error.response.data
      );

      // Handle authentication errors
      if (status === 401) {
        console.error("Authentication error:", error.response.data);
        // Only redirect if not already on login page
        if (
          window.location.pathname !== "/signin" &&
          window.location.pathname !== "/signup"
        ) {
          console.log("Redirecting to signin due to authentication error");
          window.location.href = "/signin";
        }
      }

      // Handle forbidden errors (role-based restrictions)
      if (status === 403) {
        console.error(
          "Access denied: Insufficient permissions",
          error.response.data
        );
        // Add a toast notification for admin access issues
        try {
          const toast = require("react-hot-toast");
          toast.error(
            "You don't have permission to perform this action. Admin access required."
          );
        } catch (e) {
          console.error("Could not show toast notification", e);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server:", error.request);
    } else {
      // Something happened in setting up the request
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
