"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiUsers,
  FiSearch,
  FiShare2,
  FiArrowRight,
  FiLock,
  FiSmile,
  FiMenu,
  FiX,
  FiCalendar,
  FiImage,
  FiDownload,
  FiMessageCircle,
} from "react-icons/fi";

const HomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scrolling when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";

      // Close menu when pressing escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm sticky top-0 left-0 right-0 z-50 isolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                FT
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Family Tree
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/signin"
                className="text-gray-600 hover:text-indigo-600 focus:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Get Started <FiArrowRight className="ml-2" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <FiX className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <FiMenu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <div
          className={`absolute top-full left-0 right-0 md:hidden bg-white shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/signin"
              className="block w-full px-4 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:bg-indigo-50 focus:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="block">Build Your Family Tree</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  With Ease
                </span>
              </h1>
              <p className="mt-4 max-w-lg mx-auto lg:mx-0 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl">
                Create, manage, and share your family history with our intuitive
                family tree builder. Connect generations and preserve your
                legacy.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Start for Free
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-lg text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 flex justify-center">
              <div className="relative w-full max-w-lg h-64 sm:h-72 md:h-96 overflow-hidden">
                {/* Background blobs with optimized mobile view */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-56 h-56 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full mix-blend-multiply opacity-30 animate-blob"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-56 h-56 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full mix-blend-multiply opacity-30 animate-blob animation-delay-2000"></div>
                {/* Cards with better sizing for mobile */}
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl rotate-6"></div>
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/3 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white rounded-2xl shadow-lg -rotate-3">
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        {/* Sample family tree icon or image would go here */}
                        <FiUsers className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="w-full h-3 sm:h-4 bg-gray-100 rounded-full mt-2"></div>
                      <div className="w-2/3 h-3 sm:h-4 bg-gray-100 rounded-full mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
              Features that make building your family tree simple
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-gray-500">
              Our tools help you create, manage, and share your family
              connections with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100">
                <FiUsers className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                Easy Member Management
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Add family members with detailed profiles including photos,
                dates, and relationships.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100">
                <FiShare2 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                Interactive Family Tree
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Visualize your family connections with our interactive tree view
                that adapts to any family structure.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100">
                <FiLock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                Privacy Controls
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Choose who can see your family tree with flexible privacy
                settings and sharing options.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100">
                <FiCalendar className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                Important Dates
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Keep track of birthdays, anniversaries, and other important
                family dates with customizable notifications.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100">
                <FiImage className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                Photo Albums
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Store and organize family photos with detailed captions and tags
                to preserve memories.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100">
                <FiDownload className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                Export and Backup
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Download your family tree data in multiple formats for
                safekeeping or to share with relatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
              What our users are saying
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-gray-500">
              Join thousands of families who are preserving their history with
              our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6 relative">
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiMessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-gray-600 italic mb-4 text-sm sm:text-base">
                "This app made it so easy to create my family tree. I was able
                to connect with relatives I hadn't spoken to in years!"
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold">SJ</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Sarah Johnson
                  </p>
                  <p className="text-xs text-gray-500">Family Historian</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6 relative">
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiMessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-gray-600 italic mb-4 text-sm sm:text-base">
                "The interactive tree view is amazing. My children love
                exploring their ancestry and learning about their
                great-grandparents."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold">RM</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Robert Martinez
                  </p>
                  <p className="text-xs text-gray-500">Father of Three</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-6 relative">
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiMessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-gray-600 italic mb-4 text-sm sm:text-base">
                "I've tried several family tree builders, and this is by far the
                most intuitive and feature-rich platform available."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold">EB</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Emily Brown
                  </p>
                  <p className="text-xs text-gray-500">Genealogy Enthusiast</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            Start building your family tree today
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-indigo-100">
            Join thousands of families who are documenting their history and
            connecting with relatives.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-colors"
            >
              Get Started for Free
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <div className="flex items-center justify-center sm:justify-start">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                  FT
                </div>
                <span className="text-xl font-bold text-white">
                  Family Tree
                </span>
              </div>
              <p className="mt-4 text-gray-400 text-sm text-center sm:text-left">
                Preserving family histories and connecting generations since
                2023.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Links
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/signin"
                    className="text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-900 px-2 py-1 rounded transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-900 px-2 py-1 rounded transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-900 px-2 py-1 rounded transition-colors"
                  >
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-900 px-2 py-1 rounded transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-900 px-2 py-1 rounded transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Family Tree App. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add some CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(-50%, 0) scale(1);
          }
          33% {
            transform: translate(-50%, 5%) scale(1.1);
          }
          66% {
            transform: translate(-50%, -5%) scale(0.9);
          }
          100% {
            transform: translate(-50%, 0) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
          transform-origin: center;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        /* Prevent body scroll when mobile menu is open */
        body {
          overflow-x: hidden;
          position: relative;
          width: 100%;
        }

        /* Improved mobile menu animations */
        @media (max-width: 768px) {
          .transform {
            transition-property: transform, opacity;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
