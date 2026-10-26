"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Loader2, Database, Tags } from "lucide-react";

type ComicItem = {
  id: string;
  title: string;
  type: string;
  img: string;
  rating?: number;
  readers: string;
  chapters: string;
  source?: "mangadex" | "anilist" | "komiku"; 
};

const ITEMS_PER_PAGE = 20;

export default function ComicGrid({ 
  initialComics, 
  total, 
  initialQuery = "" 
}: { 
  initialComics: ComicItem[]; 
  total?: number; 
  initialQuery?: string;
}) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeSort, setActiveSort] = useState("Populer");
  const [activeSource, setActiveSource] = useState("Semua");
  const [activeGenre, setActiveGenre] = useState("Semua"); // <-- STATE GENRE BARU
  const [currentPage, setCurrentPage] = useState(1);
  
  const [comics, setComics] = useState<ComicItem[]>(initialComics.slice(0, ITEMS_PER_PAGE));
  const [totalItems, setTotalItems] = useState<number>(total || initialComics.length);
  const [isLoading, setIsLoading] = useState(false);

  const topGridRef = useRef<HTMLDivElement>(null);
  
  // Ref untuk mencegah double fetch saat pertama kali render
  const isFirstRender = useRef(true);

  const categories = ["Semua", "Manga", "Manhwa", "Manhua"];
  const sources = ["Semua", "MangaDex", "Komiku", "AniList"];
  
  // DAFTAR GENRE
  const genres = [
    "Semua", "Action", "Romance", "Isekai", "Murim", 
    "School Life", "Fantasy", "Comedy", "Horror", "Mystery"
  ];
  
  const normalizeType = (type: string | undefined | null) => {
    if (!type) return "Manga";
    const t = type.toLowerCase().trim();
    if (t.includes("manhwa") || t.includes("korea") || t.includes("kr") || t.includes("webtoon")) return "Manhwa";
    if (t.includes("manhua") || t.includes("china") || t.includes("cn") || t.includes("tw")) return "Manhua";
    return "Manga";
  };

  const uniqueComics = useMemo(() => {
    const seen = new Set<string>();
    return comics.filter((comic) => {
      if (seen.has(comic.id)) return false;
      seen.add(comic.id);
      return true;
    });
  }, [comics]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    // Jika ini render pertama, lewati fetch (Gunakan data dari Server Component)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Tambahkan parameter &genre= ke dalam URL API
        let url = `/api/comics?page=${currentPage}&limit=${ITEMS_PER_PAGE}&category=${activeCategory}&sort=${activeSort}&source=${activeSource}&genre=${activeGenre}&t=${Date.now()}`;
        if (initialQuery) {
          url += `&q=${encodeURIComponent(initialQuery)}`;
        }

        const res = await fetch(url, { cache: "no-store" });
        
        if (!res.ok) throw new Error("Gagal");
        
        const json = await res.json();
        setComics((json.data || []).slice(0, ITEMS_PER_PAGE));
        setTotalItems(json.total || 0); 
        
      } catch (error) {
        console.error(error);
        setComics([]); 
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, activeCategory, activeSort, activeSource, activeGenre, initialQuery]); // Tambahkan activeGenre

  const handleFilterChange = (type: "category" | "sort" | "source" | "genre", value: string) => {
    if (type === "category") setActiveCategory(value);
    if (type === "sort") setActiveSort(value);
    if (type === "source") setActiveSource(value);
    if (type === "genre") setActiveGenre(value);
    setCurrentPage(1); 
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (topGridRef.current) {
      const yOffset = -100; 
      const y = topGridRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative" ref={topGridRef}>
      {/* HEADER: KATEGORI, SUMBER, GENRE, & SORTIR */}
      <div className="flex flex-row items-center justify-between gap-2 mb-8 border-b-2 border-gray-900 pb-4">
        
        {/* Kategori (Kiri) */}
        <div className="flex flex-row items-center gap-1 md:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleFilterChange("category", category)}
              disabled={isLoading}
              className={`whitespace-nowrap px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                activeCategory === category
                  ? "bg-gray-900 text-white shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                  : "bg-white border-2 border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter Desktop (Kanan) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          
          {/* Source Dropdown */}
          <Database className="w-4 h-4 text-gray-500" />
          <select
            value={activeSource}
            onChange={(e) => handleFilterChange("source", e.target.value)}
            disabled={isLoading}
            className="bg-white border-2 border-gray-900 text-gray-900 font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500"
          >
            {sources.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          {/* Genre Dropdown */}
          <Tags className="w-4 h-4 text-gray-500 ml-2" />
          <select
            value={activeGenre}
            onChange={(e) => handleFilterChange("genre", e.target.value)}
            disabled={isLoading}
            className="bg-white border-2 border-gray-900 text-gray-900 font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <SlidersHorizontal className="w-4 h-4 text-gray-500 ml-2" />
          <select
            value={activeSort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            disabled={isLoading}
            className="bg-white border-2 border-gray-900 text-gray-900 font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500"
          >
            <option value="Populer">Paling Populer</option>
            <option value="Rating">Rating Tertinggi</option>
            <option value="A-Z">Urut A - Z</option>
          </select>
        </div>

        {/* Filter Mobile (Kanan) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {/* Mobile Source */}
          <div className="relative">
            <select
              value={activeSource}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              {sources.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
            <div className={`w-8 h-8 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors ${activeSource !== "Semua" ? "bg-blue-400" : "bg-white"} ${isLoading ? "opacity-50" : ""}`}>
              <Database className="w-4 h-4 text-gray-900" />
            </div>
          </div>

          {/* Mobile Genre */}
          <div className="relative">
            <select
              value={activeGenre}
              onChange={(e) => handleFilterChange("genre", e.target.value)}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            <div className={`w-8 h-8 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors ${activeGenre !== "Semua" ? "bg-green-400" : "bg-white"} ${isLoading ? "opacity-50" : ""}`}>
              <Tags className="w-4 h-4 text-gray-900" />
            </div>
          </div>

          {/* Mobile Sort */}
          <div className="relative">
            <select
              value={activeSort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              <option value="Populer">Paling Populer</option>
              <option value="Rating">Rating Tertinggi</option>
              <option value="A-Z">Urut A - Z</option>
            </select>
            <div className={`w-8 h-8 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors ${activeSort !== "Populer" ? "bg-amber-400" : "bg-white"} ${isLoading ? "opacity-50" : ""}`}>
              <SlidersHorizontal className="w-4 h-4 text-gray-900" />
            </div>
          </div>
        </div>
      </div>

      {/* GRID KOMIK */}
      <div className="relative min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[#f4f4f4]/80 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
            <p className="font-mono text-sm uppercase tracking-widest text-gray-900 font-bold bg-white px-4 py-2 border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              Memuat {activeSource}...
            </p>
          </div>
        )}

        {uniqueComics.length > 0 ? (
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 transition-opacity duration-300 ${isLoading ? "opacity-30" : "opacity-100"}`}>
            {uniqueComics.map((comic) => {
              const isChapterSource = ["komiku", "anilist"].includes(comic.source || "");
              const label = isChapterSource ? "Ch." : "Vol.";
              
              let chapterValue = comic.chapters ? comic.chapters.toString().trim() : "-";
              if (chapterValue === "?" || chapterValue === "" || chapterValue === "null") {
                chapterValue = "-";
              }

              return (
                <Link href={`/comic/${comic.id}`} key={comic.id} className="group">
                  <div className="bg-white border-2 border-gray-900 flex flex-col h-full transition-all duration-300 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 group-hover:-translate-x-1">
                    <div className="relative aspect-[3/4] overflow-hidden border-b-2 border-gray-900 bg-gray-100">
                      <img
                        src={`/api/image?url=${encodeURIComponent(comic.img)}`}
                        alt={comic.title}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-0 right-0 bg-gray-900 text-white font-mono text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                        {normalizeType(comic.type)}
                      </div>
                      {comic.source && comic.source !== "mangadex" && (
                        <div className={`absolute top-0 left-0 text-white font-mono text-[10px] font-bold px-2 py-1 uppercase tracking-widest ${
                          comic.source === "komiku" ? "bg-green-600" : "bg-blue-600"
                        }`}>
                          {comic.source}
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-sm md:text-base text-gray-900 leading-tight uppercase line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors" title={comic.title}>
                          {comic.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                          <span className="whitespace-nowrap">
                            {label} {chapterValue}
                          </span>
                          <span className="w-1 h-1 bg-gray-400 rounded-none"></span>
                          <span className="truncate">{comic.readers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="w-full py-20 text-center border-2 border-dashed border-gray-300 bg-white">
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
              Tidak ada komik untuk sumber <strong>{activeSource}</strong> dengan genre <strong>{activeGenre}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION BAR */}
      {!isLoading && uniqueComics.length > 0 && (
        <div className="mt-12 pt-6 border-t-2 border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-sm text-gray-600 font-bold uppercase tracking-widest">
            Menampilkan {uniqueComics.length} dari <strong>{totalItems}</strong> komik 
            {activeSource !== "Semua" ? ` (${activeSource})` : ""}
            {activeGenre !== "Semua" ? ` [${activeGenre}]` : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              className="bg-white border-2 border-gray-900 text-gray-900 p-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 hover:text-white transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="bg-gray-900 text-white font-mono text-sm font-bold px-4 py-2 border-2 border-gray-900">
              HALAMAN {currentPage} / {totalPages}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
              className="bg-white border-2 border-gray-900 text-gray-900 p-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 hover:text-white transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}