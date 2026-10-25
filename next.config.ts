import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengabaikan error TypeScript saat build di Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Opsi 'eslint' sudah dihapus karena tidak lagi didukung di Next.js 16
};

export default nextConfig;