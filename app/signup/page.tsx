"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiLock,
  FiUserPlus,
  FiAlertTriangle,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast, Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { signup, setUserAndToken } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { signIn } from "next-auth/react";

const SignupPage = () => {
  const router = useRouter();
  const { loading: authLoading, isLoggedIn, checkAndSetAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      // Use the context's authentication check
      const isAuthenticated = await checkAndSetAuth();

      // Only redirect if authenticated and not already redirecting
      if (isAuthenticated && !redirecting && !authLoading) {
        setRedirecting(true);
        router.push("/dashboard");
      }
    };

    checkAuthentication();
  }, [router, redirecting, authLoading, checkAndSetAuth, isLoggedIn]);

  // Handle URL errors from NextAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");

    if (errorParam) {
      let errorMessage = "Authentication failed";

      switch (errorParam) {
        case "OAuthSignin":
          errorMessage = "Error starting OAuth sign-in";
          break;
        case "OAuthCallback":
          errorMessage = "Error during OAuth callback";
          break;
        case "OAuthAccountNotLinked":
          errorMessage = "Email already used with another provider";
          break;
        case "Callback":
          errorMessage = "Error during callback";
          break;
        case "CredentialsSignin":
          errorMessage = "Invalid email or password";
          break;
      }

      setAuthError(errorMessage);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear auth error when user modifies form
    if (authError) {
      setAuthError(null);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || redirecting) return;

    setIsLoading(true);

    try {
      const result = await signup(
        formData.name,
        formData.email,
        formData.password
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        // Store token and user data (default to session)
        setUserAndToken(result.user, result.token, false);

        toast.success("Account created successfully!");

        // Prevent multiple redirects
        setRedirecting(true);

        // Force an auth check to update the context
        await checkAndSetAuth();

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (redirecting || isLoading || isGoogleLoading) return;

    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      // Use NextAuth's signIn function for Google authentication with redirect
      await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });

      // Note: The code below will never execute due to the redirect option being true
      // The redirection is handled by NextAuth
    } catch (error) {
      console.error("Google sign-up error:", error);
      setAuthError("Failed to sign up with Google");
      toast.error("Failed to sign up with Google");
      setIsGoogleLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If already logged in and we're in the process of redirecting, show loading
  if (isLoggedIn && !redirecting) {
    setRedirecting(true);
    router.push("/dashboard");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <Toaster position="top-center" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {authError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <FiAlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="ml-3 text-sm text-red-700">{authError}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <div className="relative">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  className="pl-10 mb-0"
                  disabled={redirecting}
                />
                <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  className="pl-10 mb-0"
                  disabled={redirecting}
                />
                <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  className="pl-10 mb-0"
                  disabled={redirecting}
                />
                <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  className="pl-10 mb-0"
                  disabled={redirecting}
                />
                <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading || redirecting}
                className="group relative flex justify-center py-2.5"
                disabled={isLoading || redirecting || isGoogleLoading}
              >
                <span className="absolute left-4 inset-y-0 flex items-center">
                  <FiUserPlus className="h-5 w-5" />
                </span>
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                fullWidth
                onClick={handleGoogleSignUp}
                isLoading={isGoogleLoading}
                disabled={isLoading || redirecting || isGoogleLoading}
                className="flex justify-center items-center py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-900"
              >
                <FcGoogle className="w-5 h-5 mr-2" />
                Sign up with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
