"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiArrowLeft,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/auth";
import GoBackButton from "./GoBackButton";
import WarningDialog from "./WarningDialog";
import { toast } from "react-hot-toast";

interface NavbarProps {
  title: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  showBackButton = true,
  children,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const userIsAdmin = isAdmin(user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
              )}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              </div>
            </div>

            <div className="flex items-center">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiHome className="mr-2" />
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/family-tree"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiUsers className="mr-2" />
                  Family Tree
                </Link>

                {userIsAdmin && (
                  <Link
                    href="/dashboard/admin"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FiSettings className="mr-2" />
                    Admin
                  </Link>
                )}

                <div className="ml-4 flex items-center">
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Sign out"
                  >
                    <FiLogOut />
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <FiX className="block h-6 w-6" />
                  ) : (
                    <FiMenu className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

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

      {/* Mobile menu */}
      <div
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:hidden bg-white border-t border-gray-200`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiHome className="mr-3" />
            Dashboard
          </Link>

          <Link
            href="/dashboard/family-tree"
            className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FiUsers className="mr-3" />
            Family Tree
          </Link>

          {userIsAdmin && (
            <Link
              href="/dashboard/admin"
              className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FiSettings className="mr-3" />
              Admin
            </Link>
          )}

          <button
            onClick={() => {
              setShowLogoutDialog(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md"
          >
            <FiLogOut className="mr-3" />
            Sign Out
          </button>

          {/* Additional Content for Mobile */}
          {children && (
            <div className="px-3 py-2 border-t border-gray-200">{children}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
