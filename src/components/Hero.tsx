// src/components/Hero.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Bookmark, Share2, ArrowRight, Check } from "lucide-react";

export type HeroManga = {
  id: string;
  title: string;
  img: string;
  type: string;
  rating: number;
  chapters: string;
};

const FALLBACK_HERO: HeroManga = {
  id: "fallback-id",
  title: "Komik Setya",
  img: "https://placehold.co/1920x1080/111/fff?text=Komik+Setya",
  type: "Platform",
  rating: 5,
  chapters: "1000+",
};

export default function Hero({ mangas }: { mangas?: HeroManga[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  
  // Gunakan useMemo agar array tidak dibuat ulang setiap render
  const displayList = useMemo(() => {
    return mangas && mangas.length > 0 ? mangas.slice(0, 10) : [FALLBACK_HERO];
  }, [mangas]);

  // Ambil data bookmark dari localStorage saat komponen dimuat
  useEffect(() => {
    const saved = localStorage.getItem("komik_bookmarks");
    if (saved) {
      try {
        const bookmarks = JSON.parse(saved);
        setSavedIds(bookmarks.map((b: any) => b.id));
      } catch (e) {}
    }
  }, []);

  // Timer untuk Slider Otomatis
  useEffect(() => {
    if (displayList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayList.length]);

  // Fungsi Toggle Bookmark
  const toggleBookmark = (manga: HeroManga) => {
    let bookmarks = [];
    const saved = localStorage.getItem("komik_bookmarks");
    if (saved) {
      try { bookmarks = JSON.parse(saved); } catch (e) {}
    }

    const isExist = bookmarks.find((b: any) => b.id === manga.id);

    if (isExist) {
      bookmarks = bookmarks.filter((b: any) => b.id !== manga.id);
      setSavedIds((prev) => prev.filter((id) => id !== manga.id));
    } else {
      bookmarks.push({
        id: manga.id,
        title: manga.title,
        img: manga.img,
        type: manga.type,
        chapters: manga.chapters,
        readers: "0",
      });
      setSavedIds((prev) => [...prev, manga.id]);
    }
    
    localStorage.setItem("komik_bookmarks", JSON.stringify(bookmarks));
  };

  // Fungsi Share
  const handleShare = async (manga: HeroManga, href: string) => {
    const shareUrl = window.location.origin + href;
    const shareData = {
      title: `Baca ${manga.title} di Komik Setya`,
      text: `Baca komik ${manga.title} hanya di Komik Setya!`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link berhasil disalin ke clipboard!");
      }
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  return (
    <section className="relative bg-[#111] text-white overflow-hidden h-[500px] md:h-[600px] border-b border-gray-300">
      
      {/* REVISI: Durasi transisi dipercepat (500ms) dan menggunakan ease-out agar tidak kaku */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {displayList.map((manga, index) => {
          const isExternalUrl = manga.id.startsWith("http");
          const href = isExternalUrl ? `/search?q=${encodeURIComponent(manga.title)}` : `/comic/${manga.id}`;
          const isSaved = savedIds.includes(manga.id);
          const isFirstSlide = index === 0;

          return (
            <div key={manga.id} className="w-full h-full flex-shrink-0 relative">
              <div className="absolute inset-0">
                <img
                  src={`/api/image?url=${encodeURIComponent(manga.img)}`}
                  alt={manga.title}
                  // REVISI OPTIMASI GAMBAR:
                  loading={isFirstSlide ? "eager" : "lazy"}
                  fetchPriority={isFirstSlide ? "high" : "auto"}
                  decoding={isFirstSlide ? "sync" : "async"}
                  // Tambahkan bg-[#111] agar saat gambar belum muncul, layar tidak berkedip putih
                  className="w-full h-full object-cover object-top opacity-40 bg-[#111]"
                />
                {/* Gradient overlay dipertegas untuk menutupi gambar yang mungkin telat loading */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/95 to-transparent" />
              </div>

              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                  <div className="max-w-2xl mt-8">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="border border-gray-400 text-gray-200 font-mono text-xs font-bold px-2 py-1 uppercase tracking-widest">
                        {manga.type}
                      </span>
                      {manga.rating > 0 && (
                        <span className="text-amber-500 font-mono text-sm font-bold flex items-center gap-1">
                          ★ {manga.rating}.0
                        </span>
                      )}
                      <span className="text-gray-400 font-mono text-xs tracking-widest">
                        {manga.chapters} CHAPTERS
                      </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white mb-6 line-clamp-3">
                      {manga.title}
                    </h1>
                    
                    <p className="font-serif text-lg md:text-xl text-gray-300 italic max-w-xl mb-8 border-l-4 border-amber-500 pl-4 line-clamp-3">
                      Baca chapter terbaru dari <strong className="text-white">{manga.title}</strong>. 
                      Tersedia {manga.chapters} chapter dengan kualitas gambar terbaik. 
                      Ikuti terus petualangan seru di dunia {manga.type} ini!
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <Link
                        href={href}
                        className="bg-[#d97706] hover:bg-[#b45309] text-white font-mono font-bold uppercase tracking-widest py-3 px-8 flex items-center gap-3 transition-colors duration-200 shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:scale-95"
                      >
                        Baca Sekarang <ArrowRight className="w-4 h-4" />
                      </Link>
                      
                      {/* TOMBOL BOOKMARK */}
                      <button 
                        onClick={() => toggleBookmark(manga)}
                        className={`flex items-center gap-2 border font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors duration-200 active:scale-95 ${
                          isSaved 
                            ? "bg-white text-gray-900 border-white" 
                            : "border-gray-500 text-gray-300 hover:border-white hover:text-white"
                        }`}
                      >
                        {isSaved ? (
                          <><Check className="w-4 h-4" /> Tersimpan</>
                        ) : (
                          <><Bookmark className="w-4 h-4" /> Bookmark</>
                        )}
                      </button>
                      
                      {/* TOMBOL SHARE */}
                      <button 
                        onClick={() => handleShare(manga, href)}
                        className="flex items-center gap-2 border border-gray-500 hover:border-white text-gray-300 hover:text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors duration-200 active:scale-95"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indikator Kotak */}
      {displayList.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {displayList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              // REVISI: Gunakan transition-colors agar browser tidak menghitung layout ulang
              className={`h-2 rounded-none transition-colors duration-300 ${
                idx === currentIndex ? "w-8 bg-amber-500" : "w-2 bg-gray-500 hover:bg-gray-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}