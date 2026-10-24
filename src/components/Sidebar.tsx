import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { getRecentChapters, getTopRatedManga } from "@/lib/mangadex";

function SidebarSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="bg-gray-200 h-96 border-2 border-gray-300"></div>
      <div className="bg-gray-200 h-[500px] border-2 border-gray-300"></div>
    </div>
  );
}

async function SidebarContent() {
  await connection();

  // Ambil Chapter Terbaru & Rating Tertinggi (Top 6 agar tidak ada ruang kosong)
  const [recentChapters, topRated] = await Promise.all([
    getRecentChapters(6),
    getTopRatedManga(6), // <-- Diubah menjadi 6
  ]);

  return (
    <div className="space-y-12">
      
      {/* ========================================= */}
      {/* 1. CHAPTER TERBARU                        */}
      {/* ========================================= */}
      <div>
        <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-6">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900">
            Chapter Terbaru
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          {recentChapters.length === 0 && (
            <p className="font-mono text-xs text-gray-500 border-2 border-dashed border-gray-300 p-4 text-center">
              Gagal memuat data.
            </p>
          )}
          
          {recentChapters.map((ch) => (
            <Link
              key={ch.chapterId}
              href={`/comic/${ch.mangaId}/chapter/${ch.chapterId}`}
              className="flex gap-6 group items-center"
            >
              {/* SAMPUL BESAR */}
              <div className="w-24 h-36 md:w-32 md:h-48 flex-shrink-0 bg-white border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] overflow-hidden">
                <img 
                  src={`/api/image?url=${encodeURIComponent(ch.img)}`} 
                  alt={ch.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
              </div>

              {/* Teks Kanan */}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h3 className="font-black text-lg md:text-2xl text-gray-900 uppercase leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors mb-2 md:mb-3">
                  {ch.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 font-mono text-xs md:text-sm uppercase tracking-widest text-gray-500">
                  <span className="bg-white border-2 border-gray-300 px-2 py-0.5">
                    {ch.chapter}
                  </span>
                  <span className="w-1.5 h-1.5 bg-gray-400"></span>
                  <span className="font-bold text-gray-700">{ch.time}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. RATING TERTINGGI (Top 6)               */}
      {/* ========================================= */}
      {topRated.length > 0 && (
        <div>
          <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900">
              Rating Tertinggi
            </h2>
          </div>
          
          <div className="flex flex-col gap-6">
            {topRated.map((manga, idx) => (
              <Link key={manga.id} href={`/comic/${manga.id}`} className="flex gap-6 group items-center">
                
                {/* SAMPUL BESAR (Sama dengan Chapter Terbaru) */}
                <div className="relative w-24 h-36 md:w-32 md:h-48 flex-shrink-0 bg-white border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] overflow-hidden">
                  <img 
                    src={`/api/image?url=${encodeURIComponent(manga.img)}`} 
                    alt={manga.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  {/* Badge Peringkat Kecil di Pojok Gambar */}
                  <div className="absolute top-0 left-0 bg-gray-900 text-white font-black px-2 py-1 text-xs z-10 border-b-2 border-r-2 border-white">
                    #{idx + 1}
                  </div>
                </div>

                {/* Teks Kanan (Diperbesar) */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="font-black text-lg md:text-2xl text-gray-900 uppercase leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors mb-2 md:mb-3">
                    {manga.title}
                  </h3>
                  
                  {/* Info Bintang & Followers */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 font-mono text-xs md:text-sm uppercase tracking-widest text-gray-500">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < manga.rating ? "fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <span className="w-1.5 h-1.5 bg-gray-400"></span>
                    <span className="font-bold text-gray-700">{manga.followers} Follower</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent />
    </Suspense>
  );
}