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
  // Hostnames only (no port). Without these, the dev server blocks its own
  // client chunks and HMR socket on workspace hosts, so nothing hydrates.
  allowedDevOrigins: ["dev.local", "*.dev.local", "*.localhost", "*.web-dev.nishansanjuka.me"],
};

export default nextConfig;
