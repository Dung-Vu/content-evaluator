import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    process.env.DEV_ORIGIN_IP || "localhost",
    "localhost",
    "127.0.0.1",
  ].filter(Boolean) as string[],
  output: "standalone",
};

export default nextConfig;
