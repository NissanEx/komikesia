"use client";

import { useState, useEffect } from "react";
import { Bookmark, Check } from "lucide-react";

export default function BookmarkButton({ comic }: { comic: any }) {
  const [isSaved, setIsSaved] = useState(false);

  // Cek apakah komik ini sudah ada di localStorage saat halaman dimuat
  useEffect(() => {
    const saved = localStorage.getItem("komik_bookmarks");
    if (saved) {
      try {
        const bookmarks = JSON.parse(saved);
        if (bookmarks.some((b: any) => b.id === comic.id)) {
          setIsSaved(true);
        }
      } catch (e) {
        console.error("Gagal membaca bookmark", e);
      }
    }
  }, [comic.id]);

  const toggleBookmark = () => {
    const saved = localStorage.getItem("komik_bookmarks");
    let bookmarks = saved ? JSON.parse(saved) : [];

    if (isSaved) {
      // Hapus dari koleksi
      bookmarks = bookmarks.filter((b: any) => b.id !== comic.id);
      setIsSaved(false);
    } else {
      // Tambahkan ke koleksi
      bookmarks.push(comic);
      setIsSaved(true);
    }

    localStorage.setItem("komik_bookmarks", JSON.stringify(bookmarks));
  };

  return (
    <button
      onClick={toggleBookmark}
      className={`font-mono font-bold uppercase tracking-widest py-3 px-6 flex items-center gap-2 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 border-2 border-gray-900
        ${isSaved 
          ? "bg-gray-900 text-white" // Jika sudah disimpan
          : "bg-white text-gray-900" // Jika belum disimpan
        }
      `}
    >
      {isSaved ? (
        <>
          <Check className="w-4 h-4" /> Tersimpan
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" /> Koleksi
        </>
      )}
    </button>
  );
}