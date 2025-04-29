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
  FiUserPlus,
  FiEdit2,
  FiHelpCircle,
  FiBell,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePageTitle } from "@/lib/hooks/usePageTitle";
import { isAdmin } from "@/lib/auth";
import Navbar from "@/components/ui/Navbar";
import WarningDialog from "@/components/ui/WarningDialog";

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn, isPersistentLogin, logout, signOut } =
    useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userIsAdmin = isAdmin(user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
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

      <WarningDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? Any unsaved changes will be lost."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
        isLoading={isLoggingOut}
      />

      {/* Navbar */}
      <Navbar title="Dashboard" showBackButton={false}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Filter options"
            >
              <FiFilter />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Notifications"
            >
              <FiBell />
            </button>
          </div>
        </div>
      </Navbar>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden mb-8 backdrop-blur-md border border-white/20">
          <div className="px-6 py-8">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Welcome back, {user?.name || "User"}!
              </h1>
              <p className="mt-2 text-gray-600">
                Here's what's happening with your family tree
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-100">
                <FiUsers className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-pink-100">
                <FiHeart className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Couples</p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-emerald-100">
                <FiUsers className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Families</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <FiClock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Upcoming Events
                </p>
                <p className="text-2xl font-semibold text-gray-900">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Family Tree Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Family Tree
                  </h2>
                  <p className="text-sm text-gray-500">
                    Visualize and manage your family connections
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/family-tree"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <FiUsers className="mr-2 h-4 w-4" />
                    View Tree
                  </Link>
                  {userIsAdmin && (
                    <Link
                      href="/dashboard/add-member"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <FiPlus className="mr-2 h-4 w-4" />
                      Add Member
                    </Link>
                  )}
                </div>
              </div>
              <div className="p-6">
                <Link href="/dashboard/family-tree">
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Click to view your family tree
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Quick Actions
                  </h2>
                  <p className="text-sm text-gray-500">
                    Common tasks and shortcuts
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <Link
                    href="/dashboard/family-tree"
                    className="flex items-center p-4 text-gray-700 bg-white/80 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <FiUsers className="h-5 w-5 text-indigo-500 mr-3" />
                    <span>View Family Tree</span>
                  </Link>
                  {userIsAdmin && (
                    <Link
                      href="/dashboard/add-member"
                      className="flex items-center p-4 text-gray-700 bg-white/80 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <FiUserPlus className="h-5 w-5 text-emerald-500 mr-3" />
                      <span>Add New Member</span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard/edit-profile"
                    className="flex items-center p-4 text-gray-700 bg-white/80 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <FiEdit2 className="h-5 w-5 text-blue-500 mr-3" />
                    <span>Edit Profile</span>
                  </Link>
                  {userIsAdmin && (
                    <Link
                      href="/dashboard/admin"
                      className="flex items-center p-4 text-gray-700 bg-white/80 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <FiShield className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center p-4 text-gray-700 bg-white/80 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <FiSettings className="h-5 w-5 text-gray-500 mr-3" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center p-4 text-gray-700 bg-white/80 hover:bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <FiHelpCircle className="h-5 w-5 text-orange-500 mr-3" />
                    <span>Help & Support</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
