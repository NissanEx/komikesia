"use client";

import { usePathname } from "next/navigation";

export default function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 1. Cek halaman yang disembunyikan berdasarkan awalan path
  const hideHeaderPaths = ["/profile", "/login", "/register", "/subscription", "/download"]; 
  const isHiddenPath = hideHeaderPaths.some(path => pathname.startsWith(path));

  // 2. Cek secara spesifik jika sedang di halaman baca chapter
  const isChapterPage = pathname.includes("/chapter/");

  // Jika salah satu kondisi terpenuhi, jangan tampilkan Header Utama
  if (isHiddenPath || isChapterPage) {
    return null;
  }

  return <>{children}</>;
}