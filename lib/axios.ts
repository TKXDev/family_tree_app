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
  withCredentials: true, // This is important for sending cookies
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      // Handle authentication errors
      if (status === 401) {
        // Clear token and redirect to login if unauthorized
        localStorage.removeItem("token");

        // Only redirect if not already on login page
        if (
          window.location.pathname !== "/signin" &&
          window.location.pathname !== "/signup"
        ) {
          window.location.href = "/signin";
        }
      }

      // Handle forbidden errors (role-based restrictions)
      if (status === 403) {
        console.error("Access denied: Insufficient permissions");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
