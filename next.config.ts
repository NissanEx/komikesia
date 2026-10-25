import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tambahkan baris ini untuk memenuhi persyaratan Turbopack di Next.js 16
  turbopack: {},
};

export default nextConfig;