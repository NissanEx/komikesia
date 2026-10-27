"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

const WORDS = [
  "KOMIK", "NETWORK", "BACA", "MANGA", "MANHWA", "MANHUA", "UPDATE", "NEW",
  "CHAPTER", "RANK", "TOP", "HOT", "RAW", "EP", "VOL", "END", "LOAD",
  "PAGE", "READ", "TEXT", "X", "0", "1", "7", ".", ":", "·",
];

const DIAGONAL_WORDS = ["KOMIK NETWORK", "BACA KOMIK", "MANGA", "CHAPTER BARU", "MANHWA"];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Token = { word: string; left: number; top: number; solid: boolean };

const ROWS = 17;
const ROW_H = 14; // px

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const tokens = useMemo<Token[]>(() => {
    const rand = mulberry32(2026);
    const out: Token[] = [];
    for (let r = 0; r < ROWS; r++) {
      const density = Math.pow(1 - r / ROWS, 1.7);
      const count = Math.round(density * 26) + (r > 8 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        out.push({
          word: WORDS[Math.floor(rand() * WORDS.length)],
          left: Math.round(rand() * 980) / 10,
          top: r * ROW_H,
          solid: rand() < density * 0.55,
        });
      }
    }
    return out;
  }, []);

  const diagonals = useMemo(() => {
    const rand = mulberry32(77);
    return Array.from({ length: 11 }).map((_, i) => ({
      text: DIAGONAL_WORDS[i % DIAGONAL_WORDS.length],
      left: Math.round((i / 11) * 1000) / 10 - 4 + Math.round(rand() * 30) / 10,
      top: -20 + Math.round(rand() * 50),
      size: 18 + Math.round(rand() * 14),
    }));
  }, []);

  const { clip, specks } = useMemo(() => {
    const rand = mulberry32(404);
    const pts: string[] = ["0% 100%"];
    let x = 0;
    let level = 3;
    while (x < 100) {
      const w = 1 + Math.round(rand() * 30) / 10;
      const nx = Math.min(100, Math.round((x + w) * 10) / 10);
      const jump = Math.floor(rand() * 4) - 1.5;
      level = Math.max(0, Math.min(5, Math.round(level + jump * (rand() < 0.5 ? 1 : 2))));
      const y = level * 8;
      pts.push(`${x}% ${y}px`, `${nx}% ${y}px`);
      x = nx;
    }
    pts.push("100% 100%");

    const sp = Array.from({ length: 22 }).map(() => ({
      left: Math.round(rand() * 990) / 10,
      top: Math.round(rand() * 4) * 8,
      size: rand() < 0.5 ? 4 : 8,
    }));
    return { clip: `polygon(${pts.join(", ")})`, specks: sp };
  }, []);

  return (
    // REVISI: Menambahkan bg-[#f4f4f4] agar area yang terpotong clip-path menyesuaikan warna background utama
    <div className="relative bg-[#f4f4f4]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10">
        {specks.map((s, i) => (
          <span
            key={i}
            className="absolute bg-[#0a0a0a]"
            style={{ left: `${s.left}%`, top: s.top, width: s.size, height: s.size }}
          />
        ))}
      </div>
      
      <footer
        className="relative overflow-hidden bg-[#0a0a0a] font-mono text-[#f4f4f4]"
        style={{ clipPath: clip }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none relative h-[260px] w-full select-none overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              maskImage: "linear-gradient(to bottom, #000 0%, #000 35%, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 35%, transparent 75%)",
            }}
          >
            {diagonals.map((d, i) => (
              <span
                key={i}
                // REVISI: bg diubah ke #f4f4f4
                className="absolute origin-top-left whitespace-nowrap bg-[#f4f4f4] px-1 font-bold uppercase leading-none text-[#0a0a0a]"
                style={{
                  left: `${d.left}%`,
                  top: d.top,
                  fontSize: d.size,
                  transform: "rotate(45deg)",
                }}
              >
                {d.text}
              </span>
            ))}
          </div>

          <div className="absolute inset-0 hidden sm:block">
            {tokens.map((t, i) => (
              <span
                key={i}
                className={`absolute whitespace-nowrap text-[10px] uppercase leading-[12px] tracking-wider ${
                  t.solid
                    ? "bg-[#f4f4f4] px-[3px] font-bold text-[#0a0a0a]" // REVISI: bg diubah ke #f4f4f4
                    : "text-[#f4f4f4]/45" // REVISI: text color diubah
                }`}
                style={{ left: `${t.left}%`, top: t.top + 20 }}
              >
                {t.word}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-10 lg:col-span-8">
              <div className="flex items-center gap-4">
                <div
                  className="h-10 w-10 shrink-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, #f4f4f4 0 1.5px, transparent 1.5px 4px)", // REVISI: warna diubah
                    clipPath: "polygon(0 0, 100% 0, 100% 78%, 78% 100%, 0 100%)",
                  }}
                />
                <h2 className="text-[19px] font-medium uppercase leading-[1.15] tracking-wide">
                  Komik
                  <br />
                  Network
                </h2>
              </div>

              <p className="mt-8 max-w-lg font-sans text-[14px] leading-relaxed text-[#f4f4f4]/65">
                Komik Network adalah platform baca komik online terbaik yang menyediakan ribuan manga, manhwa, dan manhua dengan update chapter terbaru setiap hari. Nikmati pengalaman membaca tanpa batas dengan antarmuka yang cepat dan nyaman.
              </p>
            </div>
          </div>

          {/* ====== BOTTOM BAR ====== */}
          <div className="relative mt-20 border-t border-[#f4f4f4]/15 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* KIRI: Copyright & Legal Links */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-[10px] sm:text-[12px] uppercase tracking-wide text-[#f4f4f4]/60">
                <p className="whitespace-nowrap">
                  © {new Date().getFullYear()} Komik Network
                </p>
                <span className="hidden sm:inline text-[#f4f4f4]/30">•</span>
                <Link 
                  href="/privacy" 
                  className="hover:text-[#f4f4f4] hover:underline transition-colors whitespace-nowrap"
                >
                  Privacy
                </Link>
                <span className="hidden sm:inline text-[#f4f4f4]/30">•</span>
                <Link 
                  href="/terms" 
                  className="hover:text-[#f4f4f4] hover:underline transition-colors whitespace-nowrap"
                >
                  Terms
                </Link>
              </div>

              {/* KANAN: Built by & Tombol Panah */}
              <div className="flex flex-row items-center gap-3 sm:gap-6">
                <p className="text-[10px] sm:text-[12px] uppercase tracking-wide text-[#f4f4f4]/60 whitespace-nowrap">
                  Built by{" "}
                  <a 
                    href="https://web.facebook.com/profile.php?id=61595541045826" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#f4f4f4] hover:underline hover:underline-offset-4 font-bold transition-colors"
                  >
                    KOMIK NETWORK
                  </a>
                </p>
                
                <button
                  onClick={scrollToTop}
                  aria-label="Kembali ke atas"
                  className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-[3px] bg-[#f4f4f4]/10 text-[#f4f4f4] transition-colors hover:bg-[#f4f4f4]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}