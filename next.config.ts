import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/vps/:path*",
        destination: "http://64.23.180.202:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
