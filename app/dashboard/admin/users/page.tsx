"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiUser,
  FiMail,
  FiCalendar,
  FiX,
  FiAlertTriangle,
  FiUsers,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { formatShortDate } from "@/lib/utils/dateFormatters";
import Navbar from "@/components/ui/Navbar";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user, isLoggedIn, loading, isAdmin, isMainAdmin, canPromoteToAdmin } =
    useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>(
    {}
  );
  const [tokenInfo, setTokenInfo] = useState<{
    userId: string;
    preview: string;
    expires: string;
  } | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [userToPromote, setUserToPromote] = useState<string | null>(null);
  const [userToPromoteName, setUserToPromoteName] = useState<string>("");
  const [showDemotionModal, setShowDemotionModal] = useState(false);
  const [userToDemote, setUserToDemote] = useState<string | null>(null);
  const [userToDemoteName, setUserToDemoteName] = useState<string>("");

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!loading && !isLoggedIn) {
      toast.error("You must be logged in to access this page");
      router.push("/signin");
      return;
    }

    if (!loading && isLoggedIn && !isAdmin) {
      toast.error("You do not have permission to access this page");
      router.push("/dashboard");
      return;
    }

    // Fetch users if logged in as admin
    if (isLoggedIn && isAdmin) {
      fetchUsers();
    }
  }, [loading, isLoggedIn, router, isAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(
        data.data.map((user: any) => ({
          ...user,
          role: user.role as string,
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteToAdmin = (userId: string, userName: string) => {
    setUserToPromote(userId);
    setUserToPromoteName(userName);
    setShowPromotionModal(true);
  };

  const confirmPromotion = () => {
    if (userToPromote) {
      updateUserRole(userToPromote, "admin");
      setShowPromotionModal(false);
      setUserToPromote(null);
      setUserToPromoteName("");
    }
  };

  const handleDemoteToUser = (userId: string, userName: string) => {
    setUserToDemote(userId);
    setUserToDemoteName(userName);
    setShowDemotionModal(true);
  };

  const confirmDemotion = () => {
    if (userToDemote) {
      updateUserRole(userToDemote, "user");
      setShowDemotionModal(false);
      setUserToDemote(null);
      setUserToDemoteName("");
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // Prevent changing own role
    if (userId === user?._id) {
      toast.error("You cannot change your own role");
      return;
    }

    // Check if promoting to admin but not main admin
    if (newRole === "admin" && !canPromoteToAdmin) {
      toast.error(
        "Only the main administrator can promote users to admin role"
      );
      return;
    }

    try {
      setUpdatingUsers((prev) => ({ ...prev, [userId]: true }));

      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user role");
      }

      const data = await response.json();

      // Update local state
      setUsers(
        users.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );

      // If a token was generated, store it
      if (data.tokenInfo) {
        setTokenInfo({
          userId,
          preview: data.tokenInfo.tokenPreview,
          expires: data.tokenInfo.expires,
        });

        // Show success message with token info
        toast.success("User promoted to admin with new authentication token");
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user role"
      );
    } finally {
      setUpdatingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Navbar title="Manage Users" showBackButton={true} />

      {/* Promotion Confirmation Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
            <div className="bg-red-50 p-4 border-b border-red-100">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                  <FiAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-red-800">
                  Promote to Admin - Warning
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to promote{" "}
                <span className="font-semibold">{userToPromoteName}</span> to
                Admin?
              </p>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This user will gain access to sensitive features
                      including:
                    </p>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      <li>User management and role changes</li>
                      <li>System configuration settings</li>
                      <li>Complete family tree data administration</li>
                      <li>Access to all user information</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                This action will generate an admin token and provide immediate
                admin access on their next login.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPromotionModal(false);
                    setUserToPromote(null);
                    setUserToPromoteName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPromotion}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Yes, Promote to Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demotion Confirmation Modal */}
      {showDemotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
            <div className="bg-amber-50 p-4 border-b border-amber-100">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-100 rounded-full p-2">
                  <FiAlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-amber-800">
                  Demote to User - Confirmation
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to demote{" "}
                <span className="font-semibold">{userToDemoteName}</span> to a
                regular user?
              </p>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      This user will lose access to administrative features
                      including:
                    </p>
                    <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                      <li>User management capabilities</li>
                      <li>System configuration access</li>
                      <li>Administrative controls over family tree data</li>
                      <li>Access to sensitive user information</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                This change will take effect immediately. All existing admin
                tokens for this user will be invalidated.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDemotionModal(false);
                    setUserToDemote(null);
                    setUserToDemoteName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDemotion}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  Yes, Demote to User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden backdrop-blur-md border border-white/20">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    All Users
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage user roles and permissions
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-white/50 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="h-3 w-3 rounded-full bg-purple-400 mr-2"></div>
                      <span className="text-sm text-gray-600">Main Admin</span>
                    </div>
                    <div className="flex items-center bg-white/50 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="h-3 w-3 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm text-gray-600">Admin</span>
                    </div>
                    <div className="flex items-center bg-white/50 px-3 py-1.5 rounded-full shadow-sm">
                      <div className="h-3 w-3 rounded-full bg-gray-400 mr-2"></div>
                      <span className="text-sm text-gray-600">User</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                    <FiUsers className="h-8 w-8 text-indigo-600" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    No users found
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {users.map((userItem) => (
                  <div
                    key={userItem._id}
                    className={`bg-white/80 rounded-xl border ${
                      userItem._id === user?._id
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-gray-200"
                    } shadow-sm hover:shadow-lg transition-all duration-200 backdrop-blur-md hover:scale-[1.02]`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              userItem.role === "main_admin"
                                ? "bg-gradient-to-br from-purple-100 to-purple-200"
                                : userItem.role === "admin"
                                ? "bg-gradient-to-br from-green-100 to-green-200"
                                : "bg-gradient-to-br from-gray-100 to-gray-200"
                            } shadow-sm`}
                          >
                            {userItem.role === "admin" ? (
                              <FiShield className="h-6 w-6 text-indigo-600" />
                            ) : (
                              <FiUser className="h-6 w-6 text-indigo-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-base font-semibold text-gray-900">
                              {userItem.name}
                            </h3>
                            <div className="flex items-center mt-1">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  userItem.role === "main_admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : userItem.role === "admin"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {userItem.role === "main_admin"
                                  ? "Main Admin"
                                  : userItem.role === "admin"
                                  ? "Admin"
                                  : "User"}
                              </span>
                              {userItem._id === user?._id && (
                                <span className="ml-2 text-xs text-blue-600 font-medium">
                                  (Current user)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 px-3 py-2 rounded-lg">
                          <FiMail className="mr-2 h-4 w-4 text-indigo-500" />
                          {userItem.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 px-3 py-2 rounded-lg">
                          <FiCalendar className="mr-2 h-4 w-4 text-indigo-500" />
                          Joined {formatShortDate(userItem.createdAt)}
                        </div>
                      </div>

                      {userItem._id !== user?._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {userItem.role === "main_admin" ? (
                            <span className="text-sm text-gray-400 italic">
                              Main Admin (Cannot Change)
                            </span>
                          ) : userItem.role === "admin" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleDemoteToUser(userItem._id, userItem.name)
                              }
                              disabled={updatingUsers[userItem._id]}
                              className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg transition-all duration-200 ${
                                updatingUsers[userItem._id]
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              }`}
                            >
                              {updatingUsers[userItem._id] ? (
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-700"
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
                              ) : (
                                <FiUserX className="mr-2" />
                              )}
                              Demote to User
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handlePromoteToAdmin(
                                  userItem._id,
                                  userItem.name
                                )
                              }
                              disabled={
                                updatingUsers[userItem._id] ||
                                !canPromoteToAdmin
                              }
                              className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg transition-all duration-200 ${
                                !canPromoteToAdmin
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              }`}
                              title={
                                !canPromoteToAdmin
                                  ? "Only the main administrator can promote users"
                                  : ""
                              }
                            >
                              {updatingUsers[userItem._id] ? (
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700"
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
                              ) : (
                                <FiUserCheck className="mr-2" />
                              )}
                              Promote to Admin
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Token Generation Info */}
          {tokenInfo && (
            <div className="mt-6 bg-white/80 border border-green-200 rounded-xl p-4 relative backdrop-blur-md shadow-lg">
              <button
                onClick={() => setTokenInfo(null)}
                className="absolute top-2 right-2 text-green-500 hover:text-green-700 transition-colors"
                aria-label="Close"
              >
                <FiX />
              </button>
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <FiShield className="mr-2" /> Admin Token Generated
              </h3>
              <p className="text-sm text-green-700 mt-1">
                A new admin token has been generated for this user. The user
                will automatically have admin access on their next login.
              </p>
              <div className="mt-3 p-3 bg-white/50 rounded-lg border border-green-200">
                <div className="flex flex-col space-y-1">
                  <div className="text-xs text-gray-500">Token Preview:</div>
                  <div className="font-mono text-sm break-all bg-gray-50/50 p-2 rounded">
                    {tokenInfo.preview}
                  </div>
                </div>
                <div className="flex flex-col space-y-1 mt-2">
                  <div className="text-xs text-gray-500">Expires:</div>
                  <div className="text-sm font-medium">
                    {formatShortDate(tokenInfo.expires)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMainAdmin && (
            <div className="mt-8 p-4 bg-white/80 rounded-xl flex items-center backdrop-blur-md shadow-lg border border-indigo-100">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mr-4">
                <FiShield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700">
                  Main Administrator
                </h3>
                <p className="text-sm text-indigo-600">
                  You are the main administrator of this system. Only you can
                  promote users to admin role.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
