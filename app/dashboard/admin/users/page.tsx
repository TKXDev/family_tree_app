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
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { formatShortDate } from "@/lib/utils/dateFormatters";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FiArrowLeft className="mr-2" />
              <span>Dashboard</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-800">User Management</h1>
            <div className="w-6"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">All Users</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage user roles and permissions
            </p>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr
                      key={userItem._id}
                      className={
                        userItem._id === user?._id ? "bg-blue-50" : undefined
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                            {userItem.role === "admin" ? (
                              <FiShield className="h-5 w-5 text-indigo-600" />
                            ) : (
                              <FiUser className="h-5 w-5 text-indigo-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.name}
                              {userItem.role === "main_admin" && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Main Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMail className="mr-2 h-4 w-4" />
                          {userItem.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="mr-2 h-4 w-4" />
                          {formatShortDate(userItem.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userItem._id !== user?._id && (
                          <div className="flex space-x-2">
                            {userItem.role === "main_admin" ? (
                              <span className="text-gray-400 cursor-not-allowed">
                                Main Admin (Cannot Change)
                              </span>
                            ) : userItem.role === "admin" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDemoteToUser(
                                    userItem._id,
                                    userItem.name
                                  )
                                }
                                disabled={
                                  updatingUsers[userItem._id] ||
                                  userItem._id === user?._id
                                }
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded transition-colors ${
                                  userItem._id === user?._id
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "text-yellow-600 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
                                  <FiUserX className="mr-1" />
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
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded transition-colors ${
                                  !canPromoteToAdmin
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "text-green-600 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                                  <FiUserCheck className="mr-1" />
                                )}
                                Promote to Admin
                              </button>
                            )}
                          </div>
                        )}
                        {userItem._id === user?._id && (
                          <span className="text-gray-400 text-xs">
                            Current user
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Token Generation Info */}
        {tokenInfo && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 relative">
            <button
              onClick={() => setTokenInfo(null)}
              className="absolute top-2 right-2 text-green-500 hover:text-green-700"
              aria-label="Close"
            >
              <FiX />
            </button>
            <h3 className="text-lg font-medium text-green-800 flex items-center">
              <FiShield className="mr-2" /> Admin Token Generated
            </h3>
            <p className="text-sm text-green-700 mt-1">
              A new admin token has been generated for this user. The user will
              automatically have admin access on their next login.
            </p>
            <div className="mt-3 p-3 bg-white rounded border border-green-200">
              <div className="flex flex-col space-y-1">
                <div className="text-xs text-gray-500">Token Preview:</div>
                <div className="font-mono text-sm">{tokenInfo.preview}</div>
              </div>
              <div className="flex flex-col space-y-1 mt-2">
                <div className="text-xs text-gray-500">Expires:</div>
                <div className="text-sm">
                  {formatShortDate(tokenInfo.expires)}
                </div>
              </div>
            </div>
          </div>
        )}

        {isMainAdmin && (
          <div className="mt-8 p-4 bg-indigo-50 rounded-lg flex items-center">
            <FiShield className="mr-2 text-indigo-600" />
            <div>
              <h3 className="font-medium text-indigo-700">
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
  );
}
