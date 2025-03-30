"use client";

import React, { useState, useEffect } from "react";
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
import { signin, setUserAndToken } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { signIn } from "next-auth/react";

const SigninPage = () => {
  const router = useRouter();
  const { loading: authLoading, isLoggedIn, checkAndSetAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signin(formData.email, formData.password);
      if (result.error) {
        setAuthError("Invalid email or password");
        toast.error("Invalid email or password");
      } else {
        setUserAndToken(result.user, result.token, rememberMe);
        toast.success("Signed in successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      setAuthError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{" "}
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
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10 mb-0"
              />
              <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10 pr-10 mb-0"
              />
              <div className="absolute top-0 left-0 pl-3 flex items-center h-10 pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute top-0 right-3 flex items-center h-full text-gray-500 focus:outline-none"
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <div>
              <Button
                type="submit"
                fullWidth
                className="group relative flex justify-center py-2.5"
                isLoading={isLoading}
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
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              isLoading={isGoogleLoading}
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
