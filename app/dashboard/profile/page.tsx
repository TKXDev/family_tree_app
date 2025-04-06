"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDynamicPageTitle } from "@/lib/hooks/usePageTitle";
import SessionManager from "@/components/SessionManager";
import { FiKey, FiShield, FiLogOut, FiUser } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add usePageTitle hook
  useDynamicPageTitle({
    title: "My Profile",
    loading: isLoading,
    error: error,
  });

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1 bg-gray-50 rounded-l-2xl p-6 border-r border-gray-100">
              <div className="flex flex-col space-y-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Settings
                </h2>

                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 rounded-lg text-left flex items-center ${
                    activeTab === "profile"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FiUser className="mr-3" />
                  Profile Information
                </button>

                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-4 py-2 rounded-lg text-left flex items-center ${
                    activeTab === "security"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FiShield className="mr-3" />
                  Security
                </button>

                <button
                  onClick={() => setActiveTab("sessions")}
                  className={`px-4 py-2 rounded-lg text-left flex items-center ${
                    activeTab === "sessions"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FiKey className="mr-3" />
                  Active Sessions
                </button>

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-left flex items-center text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="md:col-span-2 p-6">
              {activeTab === "profile" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Profile Information
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                        {user?.name || "Not available"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                        {user?.email || "Not available"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                        {user?.role
                          ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)
                          : "Not available"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Security
                  </h3>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Password change functionality is coming soon.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      disabled
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 opacity-50 cursor-not-allowed"
                    >
                      Change Password (Coming Soon)
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "sessions" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Active Sessions
                  </h3>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Session Management
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        View and manage all your active login sessions across
                        devices. You can log out from devices you no longer use.
                      </p>

                      <div className="mt-4">
                        <SessionManager />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
