"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiMail,
  FiLock,
  FiLogIn,
  FiAlertTriangle,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast, Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { signin, setUserAndToken, validateCredentials } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { usePageTitle } from "@/lib/hooks/usePageTitle";

const SigninPage = () => {
  const router = useRouter();
  const { isLoggedIn, signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  usePageTitle("Sign In");

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateForm = () => {
    const validation = validateCredentials(formData.email, formData.password);
    if (!validation.isValid && validation.errors) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        if (error.includes("email")) {
          newErrors.email = error;
        } else if (error.includes("password")) {
          newErrors.password = error;
        }
      });
      setValidationErrors(newErrors);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted");

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Attempting to sign in with:", formData.email);
      const result = await signIn(
        formData.email,
        formData.password,
        rememberMe
      );
      console.log("Sign in result:", result);
    } catch (err) {
      console.error("Sign in error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setAuthError(null);

      const result = await nextAuthSignIn("google", {
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        setAuthError("Failed to sign in with Google");
        toast.error("Failed to sign in with Google");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  // Ensure loading states are properly managed
  React.useEffect(() => {
    // Reset local loading state when user completes successful sign-in
    if (isLoggedIn && (isLoading || isGoogleLoading)) {
      setIsLoading(false);
      setIsGoogleLoading(false);
    }
  }, [isLoggedIn, isLoading, isGoogleLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
              FT
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
              Family Tree
            </span>
          </Link>
          <Link
            href="/"
            className="text-gray-600 hover:text-indigo-600 flex items-center text-sm"
          >
            <FiArrowLeft className="mr-1" />{" "}
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">
              Please sign in to continue to your family tree
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-8 px-4 sm:px-10 shadow-lg rounded-2xl">
            {authError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Social Login */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FcGoogle className="h-5 w-5 mr-2" />
                <span className="text-gray-700 font-medium">
                  {isGoogleLoading ? "Signing in..." : "Continue with Google"}
                </span>
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-gray-500">
                  Or sign in with email
                </span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (validationErrors.email) {
                        setValidationErrors({ ...validationErrors, email: "" });
                      }
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      validationErrors.email
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm`}
                    aria-invalid={!!validationErrors.email}
                    aria-describedby={
                      validationErrors.email ? "email-error" : undefined
                    }
                  />
                </div>
                {validationErrors.email && (
                  <p id="email-error" className="text-sm text-red-600 mt-1">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (validationErrors.password) {
                        setValidationErrors({
                          ...validationErrors,
                          password: "",
                        });
                      }
                    }}
                    className={`block w-full pl-10 pr-10 py-3 border ${
                      validationErrors.password
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm`}
                    aria-invalid={!!validationErrors.password}
                    aria-describedby={
                      validationErrors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p id="password-error" className="text-sm text-red-600 mt-1">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    console.log("Sign in button clicked manually");
                    if (!isLoading) {
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                  className="relative w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-4 rounded-md text-sm hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 ease-in-out flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
