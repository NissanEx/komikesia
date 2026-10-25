"use client";

// TAMBAHKAN BARIS INI: Mencegah Next.js melakukan prerender statis pada halaman ini
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookmarkX, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Tipe data untuk komik yang disimpan
type BookmarkedComic = {
  id: string;
  title: string;
  img: string;
  type: string;
  chapters: string;
  readers?: string;
};

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedComic[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // JIKA LOGIN: Ambil dari Supabase
          const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data) {
            const formattedData = data.map((b: any) => ({
              id: b.comic_id,
              title: b.title,
              img: b.img,
              type: b.type,
              chapters: b.chapters,
              readers: "0"
            }));
            setBookmarks(formattedData);
          }
        } else {
          // JIKA GUEST: Ambil dari localStorage
          const saved = localStorage.getItem("komik_bookmarks");
          if (saved) {
            setBookmarks(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.error("Gagal membaca bookmark", e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchBookmarks();
  }, []);

  const removeBookmark = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // JIKA LOGIN: Hapus dari Supabase
        await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", session.user.id)
          .eq("comic_id", id);
      } else {
        // JIKA GUEST: Hapus dari localStorage
        const updated = bookmarks.filter((b) => b.id !== id);
        localStorage.setItem("komik_bookmarks", JSON.stringify(updated));
      }

      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      
    } catch (error) {
      console.error("Gagal menghapus bookmark", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-gray-900 pb-12 selection:bg-amber-500 selection:text-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        
        <div className="mb-10 border-b-2 border-gray-900 pb-6">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Bookmark
          </h1>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center py-20 font-mono text-sm uppercase tracking-widest">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
            Memuat koleksi...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="border-2 border-dashed border-gray-400 bg-white p-12 text-center flex flex-col items-center justify-center">
            <BookmarkX className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Belum Ada Koleksi</h2>
            <p className="font-mono text-sm text-gray-500 mb-6 max-w-md">
              Anda belum menyimpan komik apa pun. Jelajahi katalog dan tambahkan komik favorit Anda ke koleksi.
            </p>
            <Link 
              href="/katalog"
              className="bg-gray-900 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 px-8 transition-colors hover:bg-amber-600 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Jelajahi Katalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {bookmarks.map((comic) => (
              <div key={comic.id} className="group relative">
                
                <Link href={`/comic/${comic.id}`} className="block bg-white border-2 border-gray-900 flex flex-col h-full transition-all duration-300 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 group-hover:-translate-x-1">
                  <div className="relative aspect-[3/4] overflow-hidden border-b-2 border-gray-900 bg-gray-100">
                    <img 
                      src={`/api/image?url=${encodeURIComponent(comic.img)}`} 
                      alt={comic.title} 
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute top-0 right-0 bg-gray-900 text-white font-mono text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                      {comic.type}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-sm md:text-base text-gray-900 leading-tight uppercase line-clamp-2 mb-2">
                        {comic.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                        <span>Ch. {comic.chapters}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <button 
                  onClick={() => removeBookmark(comic.id)}
                  className="absolute top-2 left-2 bg-red-600 text-white p-2 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                  title="Hapus dari Koleksi"
                >
                  <BookmarkX className="w-4 h-4" />
                </button>

              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}