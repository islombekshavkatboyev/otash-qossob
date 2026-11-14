import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Dasturchi asboblari va qizil N indikatorini butunlay o'chirish */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: [
    '172.16.1.221',
    '172.16.1.221:3000',
    'localhost',
    'localhost:3000',
  ],
};

export default nextConfig;
