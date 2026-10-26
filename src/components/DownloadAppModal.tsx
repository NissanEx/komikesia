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
      
      {/* Box Modal */}
      <div className="relative bg-white border-4 border-gray-900 w-full max-w-lg shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Tombol Close */}
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 bg-gray-900 text-white p-1 hover:bg-amber-500 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gambar Ilustrasi Kiri */}
        <div className="w-full md:w-2/5 bg-gray-900 relative">
          <img 
            src="https://placehold.co/400x600/1a1a1a/ffffff?text=MANGA+APP" 
            alt="App Promo"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Overlay Teks Vertikal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-white font-black text-4xl uppercase tracking-tighter rotate-[-90deg] opacity-20">
              MOBILE
            </h2>
          </div>
        </div>

        {/* Konten Kanan */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-[#f4f4f4]">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-amber-600" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">Aplikasi Tersedia</span>
          </div>
          
          <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">
            Baca Lebih <br/><span className="text-amber-600">Cepat & Nyaman!</span>
          </h3>
          
          <p className="font-mono text-sm text-gray-600 mb-6">
            Dapatkan pengalaman membaca tanpa batas dengan aplikasi Android Comic Network. Bebas iklan, lebih responsif!
          </p>

          <Link 
            href="/download"
            onClick={handleClose} // Tutup modal saat diklik
            className="w-full bg-amber-500 border-2 border-gray-900 text-black font-mono font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
          >
            <Download className="w-5 h-5" />
            Download APK
          </Link>
          
          <button 
            onClick={handleClose}
            className="mt-4 text-xs font-mono text-gray-500 hover:text-gray-900 underline"
          >
            Nanti saja, lanjut baca di web
          </button>
        </div>

      </div>
    </div>
  );
}