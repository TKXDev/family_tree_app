"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiArrowRight,
  FiGitMerge,
  FiDatabase,
  FiUserPlus,
  FiLogIn,
  FiChevronRight,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  // Handler for authentication related navigation
  const handleAuthNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();

    // Don't navigate during loading
    if (authLoading) return;

    // If logged in, redirect to dashboard
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      // Otherwise go to the requested path
      router.push(path);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                Family Tree
              </span>
            </div>
            <div className="flex items-center">
              <a
                href="/signup"
                onClick={handleAuthNavigation("/signup")}
                className="ml-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-900 flex items-center"
              >
                <FiUserPlus className="mr-1.5" />
                Sign up
              </a>
              <a
                href="/signin"
                onClick={handleAuthNavigation("/signin")}
                className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center"
              >
                <FiLogIn className="mr-1.5" />
                Sign in
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Build Your Family Tree
            </h1>
            <p className="mt-3 max-w-md mx-auto text-lg text-indigo-100 sm:text-xl md:mt-5 md:max-w-3xl">
              Create, visualize and share your family tree with ease. Connect
              generations and preserve your family history.
            </p>
            <div className="mt-10">
              <a
                href="/signup"
                onClick={handleAuthNavigation("/signup")}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
              >
                Get Started
                <FiChevronRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">
              Everything you need to map your family history
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Family Connections
              </h3>
              <p className="mt-2 text-base text-gray-600">
                Easily add family members and define relationships between them
                to build a complete family tree.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Photo Collections
              </h3>
              <p className="mt-2 text-base text-gray-600">
                Attach photos to each family member to preserve memories and
                create visual connections.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Interactive View
              </h3>
              <p className="mt-2 text-base text-gray-600">
                Visualize your family tree with our interactive viewer, with
                zooming and panning capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <span className="text-lg font-bold text-indigo-600">
                Family Tree
              </span>
              <p className="text-sm text-gray-500 mt-2">
                © 2023 All rights reserved
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="/about"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                About
              </a>
              <a
                href="/privacy"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Terms
              </a>
              <a
                href="/contact"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
