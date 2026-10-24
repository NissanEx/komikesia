// src/app/comic/[id]/error.tsx
"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CLIENT ERROR]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Gagal Memuat Halaman</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Terjadi kesalahan saat mengambil data komik atau chapter dari sumber alternatif.
      </p>
      <button
        onClick={() => reset()}
        className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
      >
        Coba Lagi
      </button>
    </div>
  );
}