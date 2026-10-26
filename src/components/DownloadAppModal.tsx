"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Download, Smartphone } from "lucide-react";

export default function DownloadAppModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah pernah melihat iklan ini
    const hasSeen = localStorage.getItem("hasSeenAppPromo");
    
    if (!hasSeen) {
      // Tampilkan setelah 2 detik agar website sempat loading dulu
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Simpan status agar tidak muncul lagi
    localStorage.setItem("hasSeenAppPromo", "true");
  };

  if (!isOpen) return null;

  return (
    // Overlay Gelap
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      
      {/* Box Modal: flex-row agar selalu kiri-kanan */}
      <div className="relative bg-white border-4 border-gray-900 w-full max-w-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Tombol Close (Ditaruh di pojok kiri atas panel teks agar tidak menutupi gambar) */}
        <button 
          onClick={handleClose}
          className="absolute top-0 left-0 bg-gray-900 text-white p-1 md:p-1.5 hover:bg-amber-500 transition-colors z-20"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* PANEL TAWARAN (KIRI) */}
        <div className="w-[60%] md:w-3/5 p-3 pt-8 md:p-8 flex flex-col justify-center bg-[#f4f4f4]">
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <Smartphone className="w-3 h-3 md:w-5 md:h-5 text-amber-600" />
            <span className="font-mono text-[8px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Aplikasi Tersedia</span>
          </div>
          
          <h3 className="text-lg md:text-3xl font-black uppercase tracking-tighter leading-tight md:leading-none mb-2 md:mb-4">
            Baca Lebih <br/><span className="text-amber-600">Cepat & Nyaman!</span>
          </h3>
          
          <p className="font-mono text-[9px] md:text-sm text-gray-600 mb-3 md:mb-6 leading-tight md:leading-relaxed">
            Dapatkan pengalaman membaca tanpa batas dengan aplikasi Android Comic Network. Bebas iklan, lebih responsif!
          </p>

          <Link 
            href="/download"
            onClick={handleClose}
            className="w-full bg-amber-500 border-2 border-gray-900 text-black font-mono font-bold uppercase tracking-widest py-2 md:py-3 px-2 md:px-4 flex items-center justify-center gap-1 md:gap-2 hover:bg-amber-400 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] md:active:translate-y-1 text-[10px] md:text-xs text-center"
          >
            <Download className="w-3 h-3 md:w-5 md:h-5 shrink-0" />
            Download APK
          </Link>
          
          <button 
            onClick={handleClose}
            className="mt-2 md:mt-4 text-[8px] md:text-xs font-mono text-gray-500 hover:text-gray-900 underline text-center"
          >
            Nanti saja, lanjut baca di web
          </button>
        </div>

        {/* GAMBAR (KANAN) */}
        <div className="w-[40%] md:w-2/5 bg-gray-900 relative">
          <img 
            src="https://placehold.co/400x600/1a1a1a/ffffff?text=MANGA+APP" 
            alt="App Promo"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Overlay Teks Vertikal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <h2 className="text-white font-black text-xl md:text-4xl uppercase tracking-tighter rotate-[-90deg] opacity-20 whitespace-nowrap">
              MOBILE
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
}