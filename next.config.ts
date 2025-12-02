import type { NextConfig } from "next";
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error - allowedDevOrigins is valid but missing from types
    allowedDevOrigins: ["172.20.10.7:3000", "localhost:3000", "127.0.0.1:3000"],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

};

export default withPWA(nextConfig);
