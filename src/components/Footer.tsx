"use client";

import React, { useMemo } from "react";
import { ArrowUp } from "lucide-react";

const WORDS = [
  "COMIC", "NETWORK", "BACA", "MANGA", "MANHWA", "MANHUA", "UPDATE", "NEW",
  "CHAPTER", "RANK", "TOP", "HOT", "RAW", "EP", "VOL", "END", "LOAD",
  "PAGE", "READ", "TEXT", "X", "0", "1", "7", ".", ":", "·",
];

const DIAGONAL_WORDS = ["COMIC NETWORK", "BACA KOMIK", "MANGA", "CHAPTER BARU", "MANHWA"];

// PRNG deterministik -> server & client menghasilkan output yang sama (anti hydration error)
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

  // Token teks acak: padat di atas, makin jarang ke bawah (efek "luruh")
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

  // Kata besar miring di bagian atas
  const diagonals = useMemo(() => {
    const rand = mulberry32(77);
    return Array.from({ length: 11 }).map((_, i) => ({
      text: DIAGONAL_WORDS[i % DIAGONAL_WORDS.length],
      left: Math.round((i / 11) * 1000) / 10 - 4 + Math.round(rand() * 30) / 10,
      top: -20 + Math.round(rand() * 50),
      size: 18 + Math.round(rand() * 14),
    }));
  }, []);

  // Tepi atas bergerigi ala "pixel tear": tangga acak, lebar & tinggi kelipatan piksel
  const { clip, specks } = useMemo(() => {
    const rand = mulberry32(404);
    const pts: string[] = ["0% 100%"];
    let x = 0;
    let level = 3; // 0..5, tinggi = level * 8px
    while (x < 100) {
      const w = 1 + Math.round(rand() * 30) / 10; // lebar 1-4%
      const nx = Math.min(100, Math.round((x + w) * 10) / 10);
      // random walk supaya tebing naik-turun tajam
      const jump = Math.floor(rand() * 4) - 1.5;
      level = Math.max(0, Math.min(5, Math.round(level + jump * (rand() < 0.5 ? 1 : 2))));
      const y = level * 8;
      pts.push(`${x}% ${y}px`, `${nx}% ${y}px`);
      x = nx;
    }
    pts.push("100% 100%");

    // kotak piksel lepas yang "terkelupas" dari tepi
    const sp = Array.from({ length: 22 }).map(() => ({
      left: Math.round(rand() * 990) / 10,
      top: Math.round(rand() * 4) * 8,
      size: rand() < 0.5 ? 4 : 8,
    }));
    return { clip: `polygon(${pts.join(", ")})`, specks: sp };
  }, []);

  return (
    <div className="relative">
      {/* piksel lepas di atas tepi */}
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
        className="relative overflow-hidden bg-[#0a0a0a] font-mono text-[#eeede8]"
        style={{ clipPath: clip }}
      >
        {/* ====== AREA GLITCH ====== */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative h-[260px] w-full select-none overflow-hidden"
        >
          {/* kata besar miring, memudar ke bawah */}
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
                className="absolute origin-top-left whitespace-nowrap bg-[#eeede8] px-1 font-bold uppercase leading-none text-[#0a0a0a]"
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

          {/* serpihan teks kecil */}
          <div className="absolute inset-0 hidden sm:block">
            {tokens.map((t, i) => (
              <span
                key={i}
                className={`absolute whitespace-nowrap text-[10px] uppercase leading-[12px] tracking-wider ${
                  t.solid
                    ? "bg-[#eeede8] px-[3px] font-bold text-[#0a0a0a]"
                    : "text-[#eeede8]/45"
                }`}
                style={{ left: `${t.left}%`, top: t.top + 20 }}
              >
                {t.word}
              </span>
            ))}
          </div>
        </div>

        {/* ====== KONTEN UTAMA ====== */}
        <div className="mx-auto max-w-[1100px] px-6 md:px-14">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            
            {/* KIRI: Brand + Deskripsi */}
            <div className="md:col-span-10 lg:col-span-8">
              <div className="flex items-center gap-4">
                {/* ikon garis diagonal */}
                <div
                  className="h-10 w-10 shrink-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, #eeede8 0 1.5px, transparent 1.5px 4px)",
                    clipPath: "polygon(0 0, 100% 0, 100% 78%, 78% 100%, 0 100%)",
                  }}
                />
                <h2 className="text-[19px] font-medium uppercase leading-[1.15] tracking-wide">
                  Comic
                  <br />
                  Network
                </h2>
              </div>

              {/* Ganti Form Email dengan Deskripsi */}
              <p className="mt-8 max-w-lg font-sans text-[14px] leading-relaxed text-[#eeede8]/65">
                Comic Network adalah platform baca komik online terbaik yang menyediakan ribuan manga, manhwa, dan manhua dengan update chapter terbaru setiap hari. Nikmati pengalaman membaca tanpa batas dengan antarmuka yang cepat dan nyaman.
              </p>
            </div>

          </div>

          {/* ====== BOTTOM BAR ====== */}
          <div className="relative mt-24 border-t border-[#eeede8]/15 pb-8 pt-6">
            <div className="flex flex-col items-start justify-between gap-3 text-[12px] uppercase tracking-wide text-[#eeede8]/60 sm:flex-row sm:items-center">
              <p>© {new Date().getFullYear()} Comic Network</p>

              <div className="flex items-end gap-3">
                <p>
                  Built by{" "}
                  <a 
                    href="https://www.instagram.com/p/DezUBh2OPgE/#" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#eeede8] hover:underline hover:underline-offset-4"
                  >
                    SANDY W
                  </a>
                </p>
                <div className="relative h-9 w-9">
                  <span className="absolute -top-6 right-0 whitespace-nowrap rounded-[2px] bg-[#eeede8]/10 px-2 py-[3px] text-[10px] tracking-wider text-[#eeede8]/80">
                    Learn more
                  </span>
                  <button
                    onClick={scrollToTop}
                    aria-label="Kembali ke atas"
                    className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#eeede8]/10 text-[#eeede8] transition-colors hover:bg-[#eeede8]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}