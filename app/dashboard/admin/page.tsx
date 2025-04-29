"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiSettings,
  FiShield,
  FiArrowLeft,
  FiHome,
  FiLogOut,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import Navbar from "@/components/ui/Navbar";

const AdminPage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
      return;
    }

    // Redirect to dashboard if not an admin
    if (!loading && isLoggedIn && !isAdmin(user)) {
      toast.error("You don't have access to the admin panel");
      router.push("/dashboard");
      return;
    }
  }, [loading, isLoggedIn, router, user]);

  // Show loading spinner while checking auth
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render content if not an admin (will redirect)
  if (!isAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      <Navbar title="Admin Dashboard" showBackButton={true} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome to the administrative area.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FiShield className="mr-2 text-indigo-600" />
                Administrative Controls
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage your application and users from this central location.
              </p>
            </div>

            {/* Admin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {/* User Management Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiUsers className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          User Management
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            Manage Users
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a
                      href="/dashboard/admin/users"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all users
                    </a>
                  </div>
                </div>
              </div>

              {/* Settings Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiSettings className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          System Settings
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            Configure App
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Manage settings
                    </a>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiShield className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Security
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            Access Control
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Manage permissions
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
