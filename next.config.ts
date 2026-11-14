import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
