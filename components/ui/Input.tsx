import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, fullWidth = true, ...props }, ref) => {
    const widthClass = fullWidth ? "w-full" : "";

    return (
      <div className={`mb-4 ${widthClass} ${error ? "has-error" : ""}`}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          className={`px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm text-gray-900
                    ${
                      error
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : ""
                    }
                    ${className}`}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
