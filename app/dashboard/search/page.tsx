"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import {
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiEdit,
  FiEye,
  FiX,
  FiInfo,
  FiUser,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

interface FamilyMember {
  _id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  death_date?: string;
  gender: string;
  generation: number;
  photo_url?: string;
}

// ProfileImage component for consistent image handling
const ProfileImage = ({
  photoUrl,
  firstName,
  lastName,
  size = 12,
}: {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  size?: number;
}) => {
  const [error, setError] = useState(false);

  if (!photoUrl || error) {
    return (
      <div
        className={`h-${size} w-${size} rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center`}
      >
        <span className="text-indigo-800 font-medium">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative h-${size} w-${size}`}>
      <Image
        className="rounded-full object-cover"
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        fill
        sizes={`${size * 4}px`}
        onError={() => setError(true)}
      />
    </div>
  );
};

const SearchPage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Search and filter state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [generation, setGeneration] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
    }
  }, [loading, isLoggedIn, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setHasSearched(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (firstName) params.append("firstName", firstName);
      if (lastName) params.append("lastName", lastName);
      if (generation) params.append("generation", generation);
      if (gender) params.append("gender", gender);

      const response = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search family members");
      }

      const data = await response.json();
      setMembers(data.data);
      setIsLoading(false);

      if (data.count === 0) {
        toast("No family members match your search criteria", {
          icon: "🔍",
        });
      } else {
        toast.success(`Found ${data.count} family member(s)`);
      }
    } catch (err) {
      setError("Failed to search family members");
      console.error(err);
      setIsLoading(false);
      toast.error("Search failed, please try again");
    }
  };

  const clearFilters = () => {
    setFirstName("");
    setLastName("");
    setGeneration("");
    setGender("");

    if (hasSearched) {
      // Reset results when clearing filters
      setMembers([]);
      setHasSearched(false);
    }
  };

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

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Search Family
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search Form */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FiFilter className="mr-2 text-indigo-500" /> Search Filters
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Find family members by name, generation, or gender
            </p>
          </div>

          <form onSubmit={handleSearch} className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="generation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Generation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUsers className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="generation"
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none"
                  >
                    <option value="">All Generations</option>
                    <option value="1">Generation 1</option>
                    <option value="2">Generation 2</option>
                    <option value="3">Generation 3</option>
                    <option value="4">Generation 4</option>
                    <option value="5">Generation 5</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700"
                >
                  Gender
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <FiX className="mr-2" /> Clear Filters
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Searching...
                  </>
                ) : (
                  <>
                    <FiSearch className="mr-2" /> Search Members
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasSearched
                ? `Found ${members.length} family member(s)`
                : "Use the filters above to search for family members"}
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {!hasSearched ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="rounded-full bg-indigo-100 p-3 mb-4">
                    <FiSearch className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Search for family members
                  </h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    Use the search filters above to find specific family members
                    in your tree
                  </p>
                </div>
              ) : members.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <FiInfo className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No results found
                  </h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    No family members match your search criteria. Try adjusting
                    your filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <FiX className="mr-2" /> Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {members.map((member) => (
                    <div
                      key={member._id}
                      className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-5">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0">
                            <ProfileImage
                              photoUrl={member.photo_url}
                              firstName={member.first_name}
                              lastName={member.last_name}
                              size={14}
                            />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                Gen {member.generation}
                              </span>
                              <span className="text-sm text-gray-500 capitalize">
                                {member.gender}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-600 space-y-1 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              <span className="font-medium">Birth:</span>{" "}
                              {new Date(member.birth_date).toLocaleDateString()}
                            </span>
                          </div>

                          {member.death_date && (
                            <div className="flex items-center">
                              <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>
                                <span className="font-medium">Death:</span>{" "}
                                {new Date(
                                  member.death_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/edit-member/${member._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <FiEdit className="mr-1.5" /> Edit
                          </Link>
                          <Link
                            href={`/dashboard/family-tree?highlight=${member._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <FiEye className="mr-1.5" /> View in Tree
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
