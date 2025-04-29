"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

interface GoBackButtonProps {
  className?: string;
  showText?: boolean;
}

const GoBackButton: React.FC<GoBackButtonProps> = ({
  className = "",
  showText = true,
}) => {
  const router = useRouter();

  const handleGoBack = () => {
    // Get the current path
    const currentPath = window.location.pathname;

    // Define navigation rules
    const navigationRules: { [key: string]: string } = {
      "/dashboard/family-tree": "/dashboard",
      "/dashboard/add-member": "/dashboard/family-tree",
      "/dashboard/edit-member": "/dashboard/family-tree",
      "/dashboard/admin": "/dashboard",
    };

    // Check if we have a specific rule for the current path
    const targetPath = Object.entries(navigationRules).find(([path]) =>
      currentPath.startsWith(path)
    )?.[1];

    if (targetPath) {
      router.push(targetPath);
    } else {
      // Default to dashboard if no specific rule
      router.push("/dashboard");
    }
  };

  return (
    <button
      onClick={handleGoBack}
      className={`flex items-center text-indigo-600 hover:text-indigo-800 transition-colors ${className}`}
      aria-label="Go back"
    >
      <FiArrowLeft className="mr-2" />
      {showText && <span className="hidden sm:inline">Go Back</span>}
    </button>
  );
};

export default GoBackButton;
