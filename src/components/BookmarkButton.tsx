"use client";

import { useState, useEffect } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BookmarkButton({ comic }: { comic: any }) {
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cek status login dan status bookmark saat komponen dimuat
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        // Cek user session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);

        if (currentUserId) {
          // JIKA LOGIN: Cek dari Supabase
          const { data, error } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", currentUserId)
            .eq("comic_id", comic.id)
            .single();

          if (data && !error) setIsSaved(true);
        } else {
          // JIKA GUEST: Cek dari localStorage
          const saved = localStorage.getItem("komik_bookmarks");
          if (saved) {
            const bookmarks = JSON.parse(saved);
            if (bookmarks.some((b: any) => b.id === comic.id)) {
              setIsSaved(true);
            }
          }
        }
      } catch (error) {
        console.error("Gagal mengecek bookmark", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBookmarkStatus();
  }, [comic.id]);

  // 2. Fungsi Toggle Bookmark (Simpan/Hapus)
  const toggleBookmark = async () => {
    setIsLoading(true);
    try {
      if (userId) {
        // --- LOGIKA SUPABASE (UNTUK USER LOGIN) ---
        if (isSaved) {
          // Hapus dari Supabase
          await supabase
            .from("bookmarks")
            .delete()
            .eq("user_id", userId)
            .eq("comic_id", comic.id);
          setIsSaved(false);
        } else {
          // Tambahkan ke Supabase
          await supabase.from("bookmarks").insert({
            user_id: userId,
            comic_id: comic.id,
            title: comic.title,
            img: comic.img,
            type: comic.type,
            chapters: comic.chapters,
          });
          setIsSaved(true);
        }
      } else {
        // --- LOGIKA LOCALSTORAGE (UNTUK GUEST) ---
        const saved = localStorage.getItem("komik_bookmarks");
        let bookmarks = saved ? JSON.parse(saved) : [];

        if (isSaved) {
          bookmarks = bookmarks.filter((b: any) => b.id !== comic.id);
          setIsSaved(false);
        } else {
          bookmarks.push(comic);
          setIsSaved(true);
        }

        localStorage.setItem("komik_bookmarks", JSON.stringify(bookmarks));
      }
    } catch (error) {
      console.error("Gagal mengubah bookmark", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`font-mono font-bold uppercase tracking-widest py-3 px-6 flex items-center gap-2 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 border-2 border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed
        ${isSaved 
          ? "bg-gray-900 text-white" 
          : "bg-white text-gray-900" 
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
        </>
      ) : isSaved ? (
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