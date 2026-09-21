import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow internal LAN IP access without cross-origin blocking
  // @ts-ignore
  allowedDevOrigins: [
    '137.107.16.62:3000',
    '137.107.16.62',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shop.thaisonfoods.vn',
      },
    ],
  },
};

export default nextConfig;
