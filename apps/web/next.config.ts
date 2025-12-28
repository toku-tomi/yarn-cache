import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: process.env.NEXT_TP_BUILD_CACHE === "1",
  },
};

export default nextConfig;
