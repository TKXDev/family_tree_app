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
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
