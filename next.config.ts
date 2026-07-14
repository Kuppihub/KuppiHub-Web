import type { NextConfig } from "next";

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "brceejknnzrznoqzwetu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ahqxztkhzswwfqfyovol.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ allows build even if ESLint errors exist
  } as any, // Add type assertion to bypass type error
};

export default nextConfig;
