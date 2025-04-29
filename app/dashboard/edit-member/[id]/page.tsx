"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useDynamicPageTitle } from "@/lib/hooks/usePageTitle";
import {
  FiArrowLeft,
  FiSave,
  FiX,
  FiUser,
  FiCalendar,
  FiUpload,
  FiUsers,
  FiHeart,
  FiCheck,
  FiInfo,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { uploadFile, validateFile, fileToDataUrl } from "@/lib/upload-helper";
import Image from "next/image";
import Cookies from "js-cookie";
import { isAdmin } from "@/lib/auth";
import { formatISODate } from "@/lib/utils/dateFormatters";
import WarningDialog from "@/components/ui/WarningDialog";
import GoBackButton from "@/components/ui/GoBackButton";
import Navbar from "@/components/ui/Navbar";

interface FamilyMember {
  id?: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  death_date?: string;
  gender: string;
  generation: number;
  photo_url: string;
  bio: string;
  father_id: string;
  mother_id: string;
  spouse_id: string;
  children_ids: string[];
  siblings_ids: string[];
  occupation: string;
  education: string;
  location: string;
  notes: string;
  parent_ids?: string[];
}

interface MemberFormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  death_date?: string;
  gender: string;
  generation: number;
  parent_ids: string[];
  spouse_id?: string;
  photo_url?: string;
  bio: string;
  father_id: string;
  mother_id: string;
  children_ids: string[];
  siblings_ids: string[];
  occupation: string;
  education: string;
  location: string;
  notes: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

const EditMemberPage = ({ params }: PageProps) => {
  const router = useRouter();
  const routeParams = useParams();
  const { user, loading, isLoggedIn, checkAndSetAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Form state
  const [formData, setFormData] = useState<FamilyMember>({
    first_name: "",
    last_name: "",
    birth_date: "",
    death_date: "",
    gender: "male",
    generation: 1,
    parent_ids: [],
    spouse_id: "",
    photo_url: "",
    bio: "",
    father_id: "",
    mother_id: "",
    children_ids: [],
    siblings_ids: [],
    occupation: "",
    education: "",
    location: "",
    notes: "",
  });

  // Add dynamic page title
  useDynamicPageTitle({
    title:
      formData.first_name && formData.last_name
        ? `Edit ${formData.first_name} ${formData.last_name}`
        : "Edit Member",
    loading: isFetching,
    error: notFound ? new Error("Member not found") : null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [searchParent, setSearchParent] = useState("");
  const [showSpouseSelector, setShowSpouseSelector] = useState(false);
  const [searchSpouse, setSearchSpouse] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"delete" | "save" | null>(
    null
  );
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Get the ID from route params, which is safer
  const memberId =
    typeof routeParams.id === "string"
      ? routeParams.id
      : Array.isArray(routeParams.id)
      ? routeParams.id[0]
      : "";

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
    }

    // Redirect to dashboard if not an admin
    if (!loading && isLoggedIn && !isAdmin(user)) {
      toast.error("Only administrators can edit members");
      router.push("/dashboard");
    }
  }, [loading, isLoggedIn, router, user]);

  // Initial load of member data and set up preview
  useEffect(() => {
    // Fetch existing members for parent and spouse selection
    const fetchData = async () => {
      try {
        setIsFetching(true);

        if (!memberId || typeof memberId !== "string") {
          setNotFound(true);
          toast.error("Invalid member ID");
          setIsFetching(false);
          return;
        }

        // Fetch all family members for parent/spouse selection
        const treeResponse = await fetch("/api/family-tree", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!treeResponse.ok) {
          throw new Error("Failed to fetch family tree data");
        }

        const treeData = await treeResponse.json();
        if (treeData.data && treeData.data.members) {
          setExistingMembers(treeData.data.members);
        }

        // Fetch the specific member being edited
        console.log("Fetching member with ID:", memberId);
        console.log("Current user:", user);

        const memberResponse = await fetch(`/api/members/${memberId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Ensure cookies are sent with the request
        });

        const memberResponseData = await memberResponse.json();
        console.log("Member API response:", memberResponseData);

        if (!memberResponse.ok) {
          if (memberResponse.status === 404) {
            setNotFound(true);
            toast.error("Family member not found");
            setIsFetching(false);
            return;
          }
          throw new Error(
            `Failed to fetch family member: ${
              memberResponseData.error || memberResponse.statusText
            }`
          );
        }

        const memberData = memberResponseData;
        if (memberData.data) {
          // Use centralized date formatter
          setFormData({
            first_name: memberData.data.first_name,
            last_name: memberData.data.last_name,
            birth_date: formatISODate(memberData.data.birth_date),
            death_date: memberData.data.death_date
              ? formatISODate(memberData.data.death_date)
              : "",
            gender: memberData.data.gender,
            generation: memberData.data.generation,
            parent_ids: memberData.data.parent_ids || [],
            spouse_id: memberData.data.spouse_id || "",
            photo_url: memberData.data.photo_url || "",
            bio: memberData.data.bio || "",
            father_id: memberData.data.father_id || "",
            mother_id: memberData.data.mother_id || "",
            children_ids: memberData.data.children_ids || [],
            siblings_ids: memberData.data.siblings_ids || [],
            occupation: memberData.data.occupation || "",
            education: memberData.data.education || "",
            location: memberData.data.location || "",
            notes: memberData.data.notes || "",
          });

          // Set preview URL if photo_url exists
          if (memberData.data.photo_url) {
            setPreviewUrl(memberData.data.photo_url);
          }
        } else {
          throw new Error("Invalid member data received from server");
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not load family member data"
        );
      } finally {
        setIsFetching(false);
      }
    };

    if (isLoggedIn && !notFound) {
      fetchData();
    }
  }, [isLoggedIn, memberId, notFound]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData({ ...formData, parent_ids: selectedOptions });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.birth_date) {
      newErrors.birth_date = "Birth date is required";
    }

    if (
      formData.death_date &&
      new Date(formData.death_date) < new Date(formData.birth_date)
    ) {
      newErrors.death_date = "Death date cannot be before birth date";
    }

    if (formData.generation < 1) {
      newErrors.generation = "Generation must be at least 1";
    }

    // Prevent setting self as parent or spouse
    if (formData.parent_ids.includes(memberId)) {
      newErrors.parent_ids = "Cannot set self as parent";
    }

    if (formData.spouse_id === memberId) {
      newErrors.spouse_id = "Cannot set self as spouse";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Validate file
        validateFile(file);

        setSelectedFile(file);

        // Create preview URL
        const dataUrl = await fileToDataUrl(file);
        setPreviewUrl(dataUrl);

        // Clear error if exists
        if (errors.photo) {
          setErrors({ ...errors, photo: "" });
        }
      } catch (error: any) {
        setErrors({ ...errors, photo: error.message });
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete member");
      }

      toast.success("Family member deleted successfully");
      router.push("/dashboard/family-tree");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete member"
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Check authentication state before proceeding
    if (!isLoggedIn || !user) {
      toast.error("Please log in again");
      router.push("/signin");
      return;
    }

    // Show warning dialog for significant changes
    setShowSaveDialog(true);
    setPendingAction("save");
  };

  const handleConfirmAction = async () => {
    if (pendingAction === "delete") {
      await handleDelete();
    } else if (pendingAction === "save") {
      try {
        setIsSubmitting(true);

        // Upload image if selected
        let photoUrl = formData.photo_url;
        if (selectedFile) {
          try {
            setIsUploading(true);
            photoUrl = await uploadFile(selectedFile);
            setIsUploading(false);
          } catch (error) {
            console.error("Upload failed, using fallback:", error);
            toast.error(
              "Failed to upload image. Using a default image instead."
            );
            photoUrl =
              process.env.NEXT_PUBLIC_DEFAULT_PROFILE_IMAGE ||
              "https://res.cloudinary.com/dvl67fbkh/image/upload/v1711978823/samples/people/boy-snow-hoodie.jpg";
          }
        }

        // Prepare data for submission
        const submitData: Partial<FamilyMember> = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          birth_date: formData.birth_date,
          death_date: formData.death_date,
          gender: formData.gender,
          generation: formData.generation,
          parent_ids: formData.parent_ids,
          spouse_id: formData.spouse_id,
          photo_url: photoUrl,
          bio: formData.bio,
          father_id: formData.father_id,
          mother_id: formData.mother_id,
          children_ids: formData.children_ids,
          siblings_ids: formData.siblings_ids,
          occupation: formData.occupation,
          education: formData.education,
          location: formData.location,
          notes: formData.notes,
        };

        // Make the API request with explicit headers
        const response = await fetch(`/api/members/${memberId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        });

        // Check response status for authentication errors
        if (response.status === 401) {
          // Try to refresh the auth state
          const authCheck = await checkAndSetAuth();
          if (!authCheck) {
            throw new Error("Unauthorized - Please log in again");
          }
          // If auth was refreshed, retry the request
          return handleSubmit(new Event("submit") as any);
        }

        if (response.status === 403) {
          throw new Error(
            "Forbidden - You don't have permission to edit members"
          );
        }

        const responseData = await response.json();
        console.log("Update API response:", responseData);

        if (!response.ok) {
          throw new Error(
            responseData.error || "Failed to update family member"
          );
        }

        toast.success("Family member updated successfully");
        router.push("/dashboard/family-tree");
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update family member"
        );

        // If it was an authentication error, redirect to login
        if (err instanceof Error && err.message.includes("Unauthorized")) {
          router.push("/signin");
        }
      } finally {
        setIsSubmitting(false);
        setShowSaveDialog(false);
      }
    }
  };

  // Filter parents based on search term
  const filteredParents = existingMembers
    .filter((member) => member._id !== memberId) // Exclude self from parent options
    .filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      return fullName.includes(searchParent.toLowerCase());
    });

  // Filter spouses based on search term
  const filteredSpouses = existingMembers
    .filter((member) => member._id !== memberId) // Exclude self from spouse options
    .filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      return fullName.includes(searchSpouse.toLowerCase());
    });

  // Toggle parent selection
  const toggleParent = (parentId: string) => {
    setFormData((prev) => {
      const newParentIds = prev.parent_ids.includes(parentId)
        ? prev.parent_ids.filter((id) => id !== parentId)
        : [...prev.parent_ids, parentId];

      return {
        ...prev,
        parent_ids: newParentIds,
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/members/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update member");
      }

      toast.success("Family member updated successfully");
      router.push("/dashboard/family-tree");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update member"
      );
    } finally {
      setIsSubmitting(false);
      setShowWarningDialog(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <FiInfo className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Member Not Found
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4 mb-8">
              The family member you are trying to edit could not be found.
            </p>
            <Link
              href="/dashboard/family-tree"
              className="inline-flex items-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <FiArrowLeft className="mr-2" />{" "}
              <span className="hidden sm:inline">Back to Family Tree</span>
            </Link>
          </div>
        </div>
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
        isOpen={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        onConfirm={handleSave}
        title="Save Changes"
        message="Are you sure you want to save these changes?"
        confirmText="Save"
        cancelText="Cancel"
        type="warning"
      />

      <Navbar title="Edit Family Member" showBackButton={true} />

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Photo and quick profile */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
            <div className="relative">
              {previewUrl ? (
                <div className="relative group">
                  <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <Image
                      src={previewUrl}
                      alt={`${formData.first_name} ${formData.last_name}`}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(formData.photo_url || null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                    aria-label="Reset photo"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="h-28 w-28 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-md border-4 border-white">
                  <FiUser size={42} className="text-white" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white mb-1">
                {formData.first_name} {formData.last_name}
              </h2>
              <div className="text-white/80 text-sm">
                {formData.gender && (
                  <span className="capitalize">{formData.gender}</span>
                )}
                {formData.birth_date && <span className="mx-2">•</span>}
                {formData.birth_date && (
                  <span>
                    Born: {new Date(formData.birth_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <label htmlFor="photo-upload" className="group mt-3 inline-block">
                <div className="cursor-pointer flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full shadow-sm transition-all duration-200 font-medium text-sm">
                  <FiUpload className="mr-2" size={16} />
                  <input
                    id="photo-upload"
                    name="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {isUploading ? "Uploading..." : "Change photo"}
                </div>
              </label>
            </div>
          </div>

          {/* Form Navigation Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`flex items-center px-4 py-3 font-medium text-sm flex-shrink-0 border-b-2 ${
                activeTab === "basic"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              <FiUser className="mr-2" /> Personal Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dates")}
              className={`flex items-center px-4 py-3 font-medium text-sm flex-shrink-0 border-b-2 ${
                activeTab === "dates"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              <FiCalendar className="mr-2" /> Dates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("family")}
              className={`flex items-center px-4 py-3 font-medium text-sm flex-shrink-0 border-b-2 ${
                activeTab === "family"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              <FiUsers className="mr-2" /> Family
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* First Name */}
                    <div className="space-y-1">
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        First Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="first_name"
                          id="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="Enter first name"
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            errors.first_name
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          } rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none`}
                        />
                      </div>
                      {errors.first_name && (
                        <p className="text-sm text-red-600">
                          {errors.first_name}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1">
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Last Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="last_name"
                          id="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder="Enter last name"
                          className={`block w-full pl-10 pr-3 py-3 border ${
                            errors.last_name
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          } rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none`}
                        />
                      </div>
                      {errors.last_name && (
                        <p className="text-sm text-red-600">
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Gender *
                    </label>
                    <div className="flex space-x-4">
                      {["male", "female", "other"].map((gender) => (
                        <label
                          key={gender}
                          className={`flex-1 cursor-pointer flex items-center justify-center px-4 py-3 rounded-lg border ${
                            formData.gender === gender
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          } transition-colors duration-150`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={gender}
                            checked={formData.gender === gender}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="capitalize">{gender}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Generation */}
                  <div className="space-y-1">
                    <label
                      htmlFor="generation"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Generation *{" "}
                      <span className="text-xs text-gray-500">
                        (Family tree level)
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUsers className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="generation"
                        id="generation"
                        min="1"
                        value={formData.generation}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${
                          errors.generation
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none`}
                      />
                    </div>
                    {errors.generation && (
                      <p className="text-sm text-red-600">
                        {errors.generation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dates Tab */}
              {activeTab === "dates" && (
                <div className="space-y-5">
                  {/* Birth Date */}
                  <div className="space-y-1">
                    <label
                      htmlFor="birth_date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Birth Date *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="birth_date"
                        id="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${
                          errors.birth_date
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none`}
                      />
                    </div>
                    {errors.birth_date && (
                      <p className="text-sm text-red-600">
                        {errors.birth_date}
                      </p>
                    )}
                  </div>

                  {/* Death Date */}
                  <div className="space-y-1">
                    <label
                      htmlFor="death_date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Death Date{" "}
                      <span className="text-xs text-gray-500">
                        (if applicable)
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="death_date"
                        id="death_date"
                        value={formData.death_date || ""}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${
                          errors.death_date
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none`}
                      />
                    </div>
                    {errors.death_date && (
                      <p className="text-sm text-red-600">
                        {errors.death_date}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Family Relationships Tab */}
              {activeTab === "family" && (
                <div className="space-y-5">
                  {/* Parents */}
                  <div className="space-y-1">
                    <label
                      htmlFor="parent_ids"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Parents{" "}
                      <span className="text-xs text-gray-500">
                        (Select family members)
                      </span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowParentSelector(true)}
                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-left text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <div className="flex items-center">
                          <FiUsers className="text-gray-400 mr-2" />
                          <span>
                            {formData.parent_ids.length === 0
                              ? "Select parents"
                              : `${formData.parent_ids.length} parent${
                                  formData.parent_ids.length > 1 ? "s" : ""
                                } selected`}
                          </span>
                        </div>
                      </button>
                    </div>
                    {formData.parent_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.parent_ids.map((parentId) => {
                          const parent = existingMembers.find(
                            (m) => m._id === parentId
                          );
                          return parent ? (
                            <div
                              key={parentId}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {parent.first_name} {parent.last_name}
                              <button
                                type="button"
                                onClick={() => toggleParent(parentId)}
                                className="ml-1.5 text-indigo-500 hover:text-indigo-700"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    {errors.parent_ids && (
                      <p className="text-sm text-red-600">
                        {errors.parent_ids}
                      </p>
                    )}
                  </div>

                  {/* Spouse */}
                  <div className="space-y-1">
                    <label
                      htmlFor="spouse_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Spouse
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSpouseSelector(true)}
                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-left text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <div className="flex items-center">
                          <FiHeart className="text-gray-400 mr-2" />
                          <span>
                            {formData.spouse_id
                              ? existingMembers.find(
                                  (m) => m._id === formData.spouse_id
                                )
                                ? `${
                                    existingMembers.find(
                                      (m) => m._id === formData.spouse_id
                                    )?.first_name
                                  } ${
                                    existingMembers.find(
                                      (m) => m._id === formData.spouse_id
                                    )?.last_name
                                  }`
                                : "Select spouse"
                              : "Select spouse"}
                          </span>
                        </div>
                      </button>
                    </div>
                    {formData.spouse_id && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(() => {
                          const spouse = existingMembers.find(
                            (m) => m._id === formData.spouse_id
                          );
                          return spouse ? (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              {spouse.first_name} {spouse.last_name}
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    spouse_id: "",
                                  }))
                                }
                                className="ml-1.5 text-pink-500 hover:text-pink-700"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                    {errors.spouse_id && (
                      <p className="text-sm text-red-600">{errors.spouse_id}</p>
                    )}
                  </div>
                </div>
              )}

              {errors.photo && (
                <div className="mt-3 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {errors.photo}
                </div>
              )}
            </div>

            {/* Form Actions - Always visible */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Link href="/dashboard/family-tree" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full flex justify-center items-center px-5 py-3 border border-gray-300 shadow-sm rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <FiX className="mr-2" /> Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex justify-center items-center px-5 py-3 border border-transparent shadow-sm rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Parents Selector Dialog */}
      {showParentSelector && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowParentSelector(false)}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Select Parents
                    </h3>
                    <div className="mt-4 w-full">
                      <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchParent}
                          onChange={(e) => setSearchParent(e.target.value)}
                          placeholder="Search by name..."
                          className="w-full pl-10 px-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {searchParent && (
                          <button
                            type="button"
                            onClick={() => setSearchParent("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FiX size={16} />
                          </button>
                        )}
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredParents.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            {searchParent
                              ? "No matches found"
                              : "No family members available"}
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {filteredParents.map((member) => (
                              <li
                                key={member._id}
                                className="px-4 py-3 hover:bg-gray-50"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleParent(member._id)}
                                  className="w-full flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mr-3">
                                      <span className="text-indigo-800 font-medium">
                                        {member.first_name.charAt(0)}
                                        {member.last_name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-gray-900">
                                        {member.first_name} {member.last_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Generation {member.generation}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    {formData.parent_ids.includes(
                                      member._id
                                    ) ? (
                                      <div className="flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full text-white">
                                        <FiCheck size={14} />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-6 h-6 border-2 border-gray-300 rounded-full text-gray-400">
                                        <FiPlus size={14} />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowParentSelector(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spouse Selector Dialog */}
      {showSpouseSelector && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowSpouseSelector(false)}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Select Spouse
                    </h3>
                    <div className="mt-4 w-full">
                      <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchSpouse}
                          onChange={(e) => setSearchSpouse(e.target.value)}
                          placeholder="Search by name..."
                          className="w-full pl-10 px-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {searchSpouse && (
                          <button
                            type="button"
                            onClick={() => setSearchSpouse("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FiX size={16} />
                          </button>
                        )}
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                spouse_id: "",
                              }));
                              setShowSpouseSelector(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-500"
                          >
                            None (Clear selection)
                          </button>
                        </div>

                        {filteredSpouses.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            {searchSpouse
                              ? "No matches found"
                              : "No family members available"}
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {filteredSpouses.map((member) => (
                              <li
                                key={member._id}
                                className="px-4 py-3 hover:bg-gray-50"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      spouse_id: member._id,
                                    }));
                                    setShowSpouseSelector(false);
                                  }}
                                  className="w-full flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center mr-3">
                                      <span className="text-pink-800 font-medium">
                                        {member.first_name.charAt(0)}
                                        {member.last_name.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-gray-900">
                                        {member.first_name} {member.last_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Generation {member.generation}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    {formData.spouse_id === member._id ? (
                                      <div className="flex items-center justify-center w-6 h-6 bg-pink-600 rounded-full text-white">
                                        <FiCheck size={14} />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-6 h-6 border-2 border-gray-300 rounded-full text-gray-400">
                                        <FiHeart size={14} />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowSpouseSelector(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-base font-medium text-white hover:from-pink-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Warning Dialogs */}
      <WarningDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmAction}
        title="Delete Family Member"
        message="Are you sure you want to delete this family member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <WarningDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onConfirm={handleConfirmAction}
        title="Save Changes"
        message="Are you sure you want to save these changes? This will update the family member's information."
        confirmText="Save"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default EditMemberPage;
