"use client";

import React from "react";
import { FiUsers, FiArrowRight, FiGitMerge, FiDatabase } from "react-icons/fi";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Build Your Family Tree</span>
            <span className="block text-indigo-600">With Ease</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Create, manage, and share your family history with our intuitive
            family tree builder.
          </p>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
