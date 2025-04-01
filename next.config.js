/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: this disables ESLint during build
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["cdn.pixabay.com", "res.cloudinary.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
