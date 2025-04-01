"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiUsers,
  FiSearch,
  FiShare2,
  FiArrowRight,
  FiLock,
  FiSmile,
} from "react-icons/fi";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
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
            <div className="flex items-center space-x-4">
              <Link
                href="/signin"
                className="text-gray-600 hover:text-indigo-600 text-sm font-medium px-3 py-2 transition-colors"
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
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
              <div className="relative w-full max-w-lg h-64 sm:h-72 md:h-96">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full mix-blend-multiply opacity-30 animate-blob"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full mix-blend-multiply opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl rotate-6"></div>
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/3 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-white rounded-2xl shadow-lg -rotate-3">
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="relative w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        {/* Sample family tree icon or image would go here */}
                        <FiUsers className="h-16 w-16 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="w-full h-4 bg-gray-100 rounded-full mt-2"></div>
                      <div className="w-2/3 h-4 bg-gray-100 rounded-full mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Build Your Family Legacy
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-gray-500 sm:text-lg md:text-xl">
              Everything you need to create and manage your family history
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <FiUsers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Interactive Family Tree
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Build beautiful family trees with an intuitive drag-and-drop
                interface. Connect generations with ease.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <FiSearch className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Smart Search
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Quickly find family members with powerful search and filtering
                tools. Navigate large family trees with ease.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <FiShare2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Share & Collaborate
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Invite family members to view and contribute to your family
                tree. Create a living history together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">
            Start Building Your Family Tree Today
          </h2>
          <p className="mt-4 text-xl text-white/80 max-w-2xl mx-auto">
            Join thousands of families preserving their history for future
            generations.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-indigo-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-colors"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                  FT
                </div>
                <span className="text-xl font-bold text-white">
                  Family Tree
                </span>
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                Preserving family histories and connecting generations since
                2023.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Links
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/signin"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
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
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
