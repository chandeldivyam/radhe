import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: [process.env.NEXT_PUBLIC_MINIO_HOST || "localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_MINIO_HOST || "localhost",
        port: process.env.NEXT_PUBLIC_MINIO_PORT || "443",
        pathname: "/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
