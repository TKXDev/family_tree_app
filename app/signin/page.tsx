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
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast, Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { signin, setUserAndToken, validateCredentials } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { signIn } from "next-auth/react";

const SigninPage = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signin(formData.email, formData.password);
      if (result.error) {
        setAuthError(result.error);
        toast.error(result.error);
      } else {
        setUserAndToken(result.user, result.token, rememberMe);
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      }
    } catch (err) {
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

      const result = await signIn("google", {
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

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up
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
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (validationErrors.email) {
                    setValidationErrors({ ...validationErrors, email: "" });
                  }
                }}
                className={`pl-10 mb-0 ${
                  validationErrors.email ? "border-red-500" : ""
                }`}
                aria-invalid={!!validationErrors.email}
                aria-describedby={
                  validationErrors.email ? "email-error" : undefined
                }
              />
              <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
              {validationErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (validationErrors.password) {
                    setValidationErrors({ ...validationErrors, password: "" });
                  }
                }}
                className={`pl-10 pr-10 mb-0 ${
                  validationErrors.password ? "border-red-500" : ""
                }`}
                aria-invalid={!!validationErrors.password}
                aria-describedby={
                  validationErrors.password ? "password-error" : undefined
                }
              />
              <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute top-0 right-3 flex items-center h-full text-gray-500 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {validationErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">
                  {validationErrors.password}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
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
              <Button
                type="submit"
                fullWidth
                className="group relative flex justify-center py-2.5"
                isLoading={isLoading}
                disabled={isLoading}
              >
                <span className="absolute left-4 inset-y-0 flex items-center">
                  <FiLogIn className="h-5 w-5" />
                </span>
                Sign in
              </Button>
            </div>
          </form>
          <div className="mt-6">
            <Button
              type="button"
              fullWidth
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isGoogleLoading}
              className="flex justify-center items-center py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-900"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
