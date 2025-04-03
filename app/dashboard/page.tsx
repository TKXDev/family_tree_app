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
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePageTitle } from "@/lib/hooks/usePageTitle";

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn, isPersistentLogin, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
    }
  }, [loading, isLoggedIn, router]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    toast.success("Logged out successfully");
    setShowLogoutDialog(false);
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
                  className="w-full sm:w-auto flex justify-center items-center px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                  onClick={handleLogoutConfirm}
                >
                  <FiLogOut className="mr-2" /> Logout
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto flex justify-center items-center px-5 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                  onClick={handleLogoutCancel}
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

              {user?.role === "admin" && (
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

            {user?.role === "admin" && (
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
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/family-tree"
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
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

            {user?.role === "admin" && (
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
          </div>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Family Tree Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FiUsers size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Family Tree
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    View and manage your family connections
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-600">
                  Visualize your family relationships, add connections, and
                  explore your ancestry.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4">
              <Link
                href="/dashboard/family-tree"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                View family tree
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FiSearch size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search & Filter
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Find specific family members
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-600">
                  Search by name, generation, or relationship to find family
                  members quickly.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4">
              <Link
                href="/dashboard/search"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Search members
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Add Member Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FiPlus size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Member
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Create new family entries
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm text-gray-600">
                  Add new family members with details like birth dates, photos,
                  and relationships.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4">
              <Link
                href="/dashboard/add-member"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Add new member
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
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
                <Link href="/dashboard/add-member">
                  <button className="inline-flex items-center px-5 py-3 border border-transparent shadow-sm rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                    <FiPlus className="mr-2" /> Start Building
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
