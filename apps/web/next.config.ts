import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["dev.local:3001", "*.dev.local:3001"],
};

export default nextConfig;
