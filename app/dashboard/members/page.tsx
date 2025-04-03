import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMembers } from "@/lib/hooks/useMembers";
import { useAuth } from "@/lib/hooks/useAuth";
import { Member } from "@/lib/api";
import toast from "react-hot-toast";
import { useDynamicPageTitle } from "@/lib/hooks/usePageTitle";

export default function MembersPage() {
  const router = useRouter();
  const { members, loading, error, createMember, updateMember, deleteMember } =
    useMembers();
  const { user, isAdmin } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter members based on search query
  const filteredMembers = members?.filter((member) => {
    if (!searchQuery) return true;
    const memberName = member.name.toLowerCase();
    return memberName.includes(searchQuery.toLowerCase());
  });

  // Use dynamic page title
  useDynamicPageTitle({
    title: "Family Members",
    loading,
    error,
    count: members?.length,
    searchQuery: searchQuery || undefined,
    searchResults: searchQuery ? filteredMembers : undefined,
  });

  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      await deleteMember(selectedMember.id);
      toast.success("Member deleted successfully");
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (error) {
      // Error is already handled in the hook
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">Loading members...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Family Members</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center text-green-600 mr-2">
              <span className="mr-1">🛡️</span>
              <span className="text-sm font-medium">Admin</span>
            </div>
          )}
          {isAdmin ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Member
            </button>
          ) : (
            <div className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-md flex items-center">
              <span className="mr-1">⚠️</span>
              Admin privileges required to manage members
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
          <p className="text-amber-700">
            You are currently logged in as a regular user. Only admin users can
            add, edit, or delete family members. If you need to make changes,
            please contact an administrator.
          </p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {!members || members.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No family members found
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {members.map((member) => (
              <li key={member.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {member.photo ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={member.photo}
                          alt={member.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.birthDate
                            ? `Born: ${member.birthDate}`
                            : "No birth date"}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Delete Member</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete {selectedMember.name}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Member</h2>
            {/* Form fields would go here */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal placeholder */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Member</h2>
            {/* Form fields would go here */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
