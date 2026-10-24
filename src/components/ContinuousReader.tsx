"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// ==========================================
// Komponen Khusus Gambar (Anti Kotak Kosong)
// ==========================================
function PageImage({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full relative bg-[#f4f4f4] min-h-[300px] flex items-center justify-center">
      {/* Spinner Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#e5e5e5]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
          <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Memuat Gambar...</span>
        </div>
      )}

      {/* Gambar Asli */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`w-full h-auto transition-opacity duration-500 ${
          isLoading ? "opacity-0 absolute inset-0" : "opacity-100"
        }`}
        loading="lazy" // Tetap lazy agar tidak membebani browser
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

// ==========================================
// Komponen Utama Continuous Reader
// ==========================================
export default function ContinuousReader({ initialData, mangaId }: { initialData: any, mangaId: string }) {
  const [chapters, setChapters] = useState<any[]>([initialData]);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const currentChapter = chapters[chapters.length - 1];
  const nextChapterId = currentChapter.nextChapterId;

  useEffect(() => {
    if (!nextChapterId || loading) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        // Gunakan rootMargin 0px agar hanya terpicu saat benar-benar di dasar halaman
        if (entries[0].isIntersecting) {
          setLoading(true);
          try {
            const res = await fetch(`/api/read/${nextChapterId}?mangaId=${mangaId}`);
            const data = await res.json();
            
            if (data.images && data.images.length > 0) {
              setChapters((prev) => [...prev, data]);
            } else {
              setChapters((prev) => [...prev, { ...data, nextChapterId: null }]);
            }
          } catch (err) {
            console.error("Gagal memuat chapter selanjutnya", err);
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px" } // <-- Diubah menjadi 0px
    );

    if (triggerRef.current) observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [nextChapterId, loading, mangaId]);

  return (
    <div className="flex flex-col items-center w-full bg-[#e5e5e5]">
      {chapters.map((chapter, chapterIdx) => (
        <div key={chapterIdx} className="w-full flex flex-col items-center">
          
          {/* Pembatas Chapter */}
          {chapterIdx > 0 && (
            <div className="w-full max-w-3xl px-4 py-16 bg-white border-y-2 border-gray-900 text-center font-mono mt-12 mb-8 shadow-[0_8px_0_rgba(0,0,0,0.1)]">
              <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">
                Lanjut ke
              </p>
              <h3 className="font-black text-gray-900 text-4xl uppercase tracking-tighter">
                Chapter {chapter.chapterNumber || "Selanjutnya"}
              </h3>
            </div>
          )}

          {/* Render Gambar & Indikator Halaman */}
          {chapter.images.map((img: string, i: number) => (
            <div key={i} className="w-full max-w-3xl flex flex-col items-center mb-0.5 md:mb-1">
              
              <div className="w-full bg-white text-gray-400 font-mono text-[10px] text-center py-1 uppercase tracking-widest border-b border-gray-200">
                Halaman {i + 1} / {chapter.images.length}
              </div>

              {/* Panggil komponen PageImage di sini */}
              <PageImage 
                src={`/api/image?url=${encodeURIComponent(img)}`} 
                alt={`Halaman ${i + 1}`} 
              />
            </div>
          ))}
        </div>
      ))}

      {/* Area Trigger / Penanda Selesai */}
      {nextChapterId ? (
        <div ref={triggerRef} className="py-24 flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest text-gray-500 w-full max-w-3xl">
          {loading ? (
            <div className="bg-white border-2 border-gray-900 p-8 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500" />
              <span className="font-black text-gray-900 text-lg">Mencetak Chapter Selanjutnya...</span>
              <span className="text-gray-500 mt-2">Mohon tunggu sebentar</span>
            </div>
          ) : (
            <span className="opacity-50">Scroll ke bawah untuk memuat</span>
          )}
        </div>
      ) : (
        <div className="w-full max-w-3xl py-16 text-center border-t-2 border-gray-900 mt-8 bg-white font-mono mb-20 shadow-[0_-4px_0_rgba(0,0,0,0.1)]">
          <h2 className="font-black text-gray-900 text-xl uppercase tracking-widest mb-2">Chapter Terakhir</h2>
          <p className="text-gray-500 text-xs mb-6 uppercase tracking-widest">Anda telah mencapai akhir komik ini.</p>
          <Link href={`/comic/${mangaId}`} className="inline-block bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold uppercase tracking-widest py-3 px-8 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
            Kembali ke Detail
          </Link>
        </div>
      )}
    </div>
  );
}