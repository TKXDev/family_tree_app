"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiLogOut,
  FiUser,
  FiHome,
  FiSettings,
  FiGrid,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiUsers,
  FiPlus,
  FiMenu,
  FiX,
  FiActivity,
  FiHeart,
  FiInfo,
  FiStar,
  FiShield,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { isAdmin } from "@/lib/auth";

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn, isPersistentLogin, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
    }
  }, [loading, isLoggedIn, router]);

  // Ensure the loading state immediately affects the UI
  useEffect(() => {
    // Force a re-render when loading state changes
    if (!loading && user) {
      // Loading complete and user is available
      const timer = setTimeout(() => {
        // This is just to trigger a re-render and ensure loading screen closes
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsSubmitting(true);

      // Call logout function from AuthContext
      await logout();

      // Show success message
      toast.success("Logged out successfully");

      // Clear any potential cookies that might be keeping the session alive
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Clear localStorage as backup
      localStorage.removeItem("token");
      localStorage.removeItem("persistent_login");

      // Force redirect with window.location (more reliable than router)
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
      setShowLogoutDialog(false);
      setIsSubmitting(false);

      // Even if there's an error, try to force logout
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/signin";
      }, 2000);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  usePageTitle("Dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl transform transition-all">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                    <FiAlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Logout Confirmation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Are you sure you want to log out? Any unsaved changes
                        will be lost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
                <button
                  type="button"
                  className="w-full sm:w-auto flex justify-center items-center px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 disabled:opacity-70"
                  onClick={handleLogoutConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <FiLogOut className="mr-2" /> Logout
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto flex justify-center items-center px-5 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                  onClick={handleLogoutCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                  FT
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
                  Family Tree
                </h1>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <FiX className="block h-6 w-6" />
                ) : (
                  <FiMenu className="block h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.role || "user"}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                onClick={handleLogoutClick}
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>

              {isAdmin(user) && (
                <Link
                  href="/dashboard/admin"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <FiSettings className="mr-2" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div
          className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
          id="mobile-menu"
        >
          <div className="pt-2 pb-3 space-y-1 border-t border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || "user"}
                  </p>
                </div>
              </div>
            </div>

            {isAdmin(user) && (
              <Link
                href="/dashboard/admin"
                className="flex items-center px-4 py-3 text-base font-medium text-indigo-600"
              >
                <FiSettings className="mr-3 h-5 w-5 text-indigo-500" />
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleLogoutClick}
              className="flex w-full items-center px-4 py-3 text-base font-medium text-red-600"
            >
              <FiLogOut className="mr-3 h-5 w-5 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-8 sm:px-8 sm:flex sm:items-center sm:justify-between">
            <div className="text-white">
              <h2 className="text-xl font-bold sm:text-2xl">
                Welcome back, {user?.name}!
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  {user?.role || "user"}
                </span>
                {isPersistentLogin ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-400/20 text-white backdrop-blur-sm">
                    <FiClock className="mr-1" /> Remember Me Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-white backdrop-blur-sm">
                    <FiClock className="mr-1" /> Session Login
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/80">
                {isPersistentLogin
                  ? "Your login will persist for 30 days."
                  : "Your login will expire when you close your browser."}
              </p>
            </div>
            <div className="mt-5 sm:mt-0 hidden sm:block">
              <div className="h-24 w-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border-4 border-white/20">
                <FiUser size={48} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions 55555
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/family-tree"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-3">
                  <FiUsers size={24} />
                </div>
                <p className="font-medium text-gray-900">Family Tree</p>
              </div>
            </Link>

            <Link
              href="/dashboard/search"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
                  <FiSearch size={24} />
                </div>
                <p className="font-medium text-gray-900">Search</p>
              </div>
            </Link>

            {isAdmin(user) && (
              <Link
                href="/dashboard/add-member"
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
                    <FiPlus size={24} />
                  </div>
                  <p className="font-medium text-gray-900">Add Member</p>
                </div>
              </Link>
            )}

            {isAdmin(user) && (
              <Link
                href="/dashboard/admin"
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors mb-3">
                    <FiSettings size={24} />
                  </div>
                  <p className="font-medium text-gray-900">Admin</p>
                </div>
              </Link>
            )}

            {isAdmin(user) && (
              <Link
                href="/dashboard/admin/users"
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors mb-3">
                    <FiShield size={24} />
                  </div>
                  <p className="font-medium text-gray-900">User Management</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          {/* Family Tree Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
            <div className="h-3 bg-gradient-to-r from-green-400 to-green-600"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="bg-green-100 rounded-full p-3">
                  <FiUsers className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                Family Tree
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                View and explore your family tree visualizations
              </p>
              <div className="mt-5">
                <Link
                  href="/dashboard/family-tree"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <FiUsers className="mr-2" /> View Family Tree
                </Link>
              </div>
            </div>
          </div>

          {/* Members Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
            <div className="h-3 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiGrid className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                Members
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Browse and manage all family members
              </p>
              <div className="mt-5 space-y-3">
                <Link
                  href="/dashboard/members"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <FiGrid className="mr-2" /> View Members
                </Link>

                {isAdmin(user) && (
                  <Link
                    href="/dashboard/add-member"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <FiPlus className="mr-2" /> Add New Member
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
            <div className="h-3 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="bg-purple-100 rounded-full p-3">
                  <FiSearch className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                Search
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Find specific family members quickly
              </p>
              <div className="mt-5">
                <Link
                  href="/dashboard/search"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <FiSearch className="mr-2" /> Search Members
                </Link>
              </div>
            </div>
          </div>

          {/* Admin Card - Only visible to admins */}
          {isAdmin(user) && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
              <div className="h-3 bg-gradient-to-r from-red-400 to-red-600"></div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="bg-red-100 rounded-full p-3">
                    <FiShield className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">
                  Admin
                </h3>
                <p className="mt-2 text-gray-600 text-sm">
                  Manage users and system settings
                </p>
                <div className="mt-5 space-y-3">
                  <Link
                    href="/dashboard/admin/users"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <FiUsers className="mr-2" /> User Management
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiActivity className="mr-2 text-indigo-600" /> Recent Activity
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your latest actions and updates
            </p>
          </div>
          <div className="bg-white px-6 py-8">
            <div className="text-center text-gray-500">
              <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                <FiGrid className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-4 text-base font-medium text-gray-900">
                No recent activity
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                Start building your family tree to see activity here. Add family
                members and create connections.
              </p>
              <div className="mt-6">
                {isAdmin(user) && (
                  <Link href="/dashboard/add-member">
                    <button className="inline-flex items-center px-5 py-3 border border-transparent shadow-sm rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                      <FiPlus className="mr-2" /> Start Building
                    </button>
                  </Link>
                )}
                {!isAdmin(user) && (
                  <div className="inline-flex items-center px-5 py-3 border border-amber-200 rounded-lg text-sm font-medium text-amber-700 bg-amber-50">
                    <FiInfo className="mr-2" /> Only admins can add members
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
