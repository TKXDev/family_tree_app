import React, { ReactNode } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface WarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
  isLoading?: boolean;
}

const WarningDialog: React.FC<WarningDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return "bg-red-50 text-red-800 border-red-200";
      case "info":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-yellow-600 hover:bg-yellow-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:p-6">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={onClose}
                disabled={isLoading}
              >
                <span className="sr-only">Close</span>
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div
                className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${getTypeStyles()} sm:mx-0 sm:h-10 sm:w-10`}
              >
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  className={`text-lg font-medium leading-6 ${getTypeStyles()}`}
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${getButtonStyles()}`}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningDialog;
