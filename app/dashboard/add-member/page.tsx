"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  FiArrowLeft,
  FiSave,
  FiX,
  FiUpload,
  FiUser,
  FiCalendar,
  FiUsers,
  FiHeart,
  FiMoreHorizontal,
  FiCheck,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { uploadFile, validateFile, fileToDataUrl } from "@/lib/upload-helper";
import Image from "next/image";

interface FamilyMember {
  _id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  generation: number;
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
}

const AddMemberPage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
  const [activeSection, setActiveSection] = useState<string>("basic");

  // Form state
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: "",
    last_name: "",
    birth_date: "",
    death_date: "",
    gender: "male",
    generation: 1,
    parent_ids: [] as string[],
    spouse_id: "",
    photo_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [searchParent, setSearchParent] = useState("");
  const [showSpouseSelector, setShowSpouseSelector] = useState(false);
  const [searchSpouse, setSearchSpouse] = useState("");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    // Fetch existing members for parent and spouse selection
    const fetchExistingMembers = async () => {
      try {
        const response = await fetch("/api/family-tree", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch family members");
        }

        const data = await response.json();
        if (data.data && data.data.members) {
          setExistingMembers(data.data.members);
        }
      } catch (err) {
        console.error(err);
        toast.error("Could not load existing family members");
      }
    };

    if (isLoggedIn) {
      fetchExistingMembers();
    }
  }, [isLoggedIn]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

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
          toast.error("Failed to upload image. Using a default image instead.");
          // Use a fallback image if upload fails
          photoUrl =
            process.env.NEXT_PUBLIC_DEFAULT_PROFILE_IMAGE ||
            "https://res.cloudinary.com/dvl67fbkh/image/upload/v1711978823/samples/people/boy-snow-hoodie.jpg";
        }
      }

      // Prepare data for submission by creating a new object with only defined values
      const submitData: MemberFormData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        gender: formData.gender,
        generation: formData.generation,
        parent_ids: formData.parent_ids,
      };

      // Only add optional fields if they have values
      if (formData.death_date) submitData.death_date = formData.death_date;
      if (formData.spouse_id) submitData.spouse_id = formData.spouse_id;
      if (photoUrl) submitData.photo_url = photoUrl;

      const response = await fetch("/api/member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add family member");
      }

      toast.success("Family member added successfully");

      // Redirect to family tree page
      router.push("/dashboard/family-tree");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add family member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter parents based on search term
  const filteredParents = existingMembers.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchParent.toLowerCase());
  });

  // Filter spouses based on search term
  const filteredSpouses = existingMembers.filter((member) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

      {/* Header - Simplified for mobile */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/family-tree"
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FiArrowLeft className="mr-2" /> Back
            </Link>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              Add Family Member
            </h1>
            <div className="w-6"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      {/* Main Content - Card with smooth edges and shadow */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          {/* Profile Photo Upload - Prominent at the top */}
          <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 flex flex-col items-center justify-center">
            <div className="relative mb-4">
              {previewUrl ? (
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    aria-label="Remove photo"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-md border-4 border-white">
                  <FiUser size={52} className="text-white" />
                </div>
              )}
            </div>

            <label htmlFor="photo-upload" className="group">
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
                {isUploading ? "Uploading..." : "Upload photo"}
              </div>
            </label>
            {errors.photo && (
              <p className="mt-2 text-sm text-white bg-red-400/60 px-3 py-1 rounded-full backdrop-blur-sm">
                {errors.photo}
              </p>
            )}
          </div>

          {/* Form Navigation - Tabs for different sections */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveSection("basic")}
              className={`flex items-center px-4 py-3 font-medium text-sm flex-shrink-0 border-b-2 ${
                activeSection === "basic"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiUser className="mr-2" /> Personal Info
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("dates")}
              className={`flex items-center px-4 py-3 font-medium text-sm flex-shrink-0 border-b-2 ${
                activeSection === "dates"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiCalendar className="mr-2" /> Dates
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("family")}
              className={`flex items-center px-4 py-3 font-medium text-sm flex-shrink-0 border-b-2 ${
                activeSection === "family"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiUsers className="mr-2" /> Family
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              {/* Basic Info Section */}
              {activeSection === "basic" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* First Name */}
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        className={`block w-full px-4 py-3 bg-gray-50 border ${
                          errors.first_name
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none transition duration-150`}
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.first_name}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        className={`block w-full px-4 py-3 bg-gray-50 border ${
                          errors.last_name
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none`}
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                  <div>
                    <label
                      htmlFor="generation"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Generation *{" "}
                      <span className="text-xs text-gray-500">
                        (Family tree level)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="generation"
                        id="generation"
                        min="1"
                        value={formData.generation}
                        onChange={handleChange}
                        className={`block w-full px-4 py-3 bg-gray-50 border ${
                          errors.generation
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg shadow-sm text-gray-900 focus:outline-none`}
                      />
                      {errors.generation && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.generation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dates Section */}
              {activeSection === "dates" && (
                <div className="space-y-5">
                  {/* Birth Date */}
                  <div>
                    <label
                      htmlFor="birth_date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Birth Date *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="birth_date"
                        id="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        className={`block w-full pl-10 px-4 py-3 bg-gray-50 border ${
                          errors.birth_date
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg shadow-sm text-gray-900 focus:outline-none`}
                      />
                    </div>
                    {errors.birth_date && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.birth_date}
                      </p>
                    )}
                  </div>

                  {/* Death Date */}
                  <div>
                    <label
                      htmlFor="death_date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Death Date{" "}
                      <span className="text-xs text-gray-500">
                        (if applicable)
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="death_date"
                        id="death_date"
                        value={formData.death_date || ""}
                        onChange={handleChange}
                        className={`block w-full pl-10 px-4 py-3 bg-gray-50 border ${
                          errors.death_date
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } rounded-lg shadow-sm text-gray-900 focus:outline-none`}
                      />
                    </div>
                    {errors.death_date && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.death_date}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Family Relationships Section */}
              {activeSection === "family" && (
                <div className="space-y-5">
                  {/* Parents */}
                  <div>
                    <label
                      htmlFor="parent_ids"
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                  </div>

                  {/* Spouse */}
                  <div>
                    <label
                      htmlFor="spouse_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                  </div>
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
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex justify-center items-center px-5 py-3 border border-transparent shadow-sm rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Add Family Member
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
                        <input
                          type="text"
                          value={searchParent}
                          onChange={(e) => setSearchParent(e.target.value)}
                          placeholder="Search by name..."
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
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
                            No family members found
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
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
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
                            No family members found
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
                                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMemberPage;
