"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function AutoNext({ nextChapterId, mangaId }: { nextChapterId: string; mangaId: string }) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false);

  // 1. Syarat Mutlak: User harus sudah scroll minimal 1000px
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 1000) {
        setHasScrolledEnough(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Deteksi jika user menyentuh ujung paling bawah
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Hanya terpicu jika elemen terlihat DAN user sudah scroll 1000px
        if (entries[0].isIntersecting && hasScrolledEnough) {
          setCountdown(5); // Beri waktu 5 detik
        } else {
          setCountdown(null); // Batalkan jika user scroll ke atas
        }
      },
      { threshold: 0.5 }
    );

    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasScrolledEnough]);

  // 3. Logika Hitung Mundur
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      router.push(`/comic/${mangaId}/chapter/${nextChapterId}`);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, nextChapterId, mangaId, router]);

  return (
    <div ref={bottomRef} className="w-full py-16 flex flex-col items-center justify-center border-t-2 border-gray-900 mt-8 bg-[#f4f4f4] font-mono">
      <h2 className="font-black text-gray-900 text-2xl uppercase tracking-tighter mb-2">
        Chapter Selesai
      </h2>
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-8 h-4">
        {countdown !== null 
          ? `Lanjut otomatis dalam ${countdown} detik...` 
          : "Scroll ke bawah atau klik tombol"}
      </p>
      <button
        onClick={() => router.push(`/comic/${mangaId}/chapter/${nextChapterId}`)}
        className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold uppercase tracking-widest py-4 px-8 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
      >
        Chapter Selanjutnya <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}