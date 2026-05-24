import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "192.168.1.53",
    "192.168.1.53:3000",
    "localhost",
    "127.0.0.1",
  ],
  output: "standalone",
};

export default nextConfig;
