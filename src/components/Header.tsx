"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, LogIn, Home, LayoutGrid, Bookmark } from "lucide-react";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Beranda", href: "/", icon: Home },
    { name: "Katalog", href: "/katalog", icon: LayoutGrid },
    { name: "Bookmark", href: "/bookmark", icon: Bookmark },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
      {/* Container Utama (Satu Baris) */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 h-16 md:h-20 flex flex-row items-center justify-between gap-2 md:gap-6">
        
        {/* 1. Logo CN */}
        <Link 
          href="/" 
          className="bg-gray-900 text-white w-9 h-9 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] md:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[2px] transition-all"
        >
          <span className="text-sm md:text-xl font-black tracking-tighter">CN</span>
        </Link>

        {/* 2. Navigasi Teks (Hanya Desktop) */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest flex-shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 transition-colors ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-900 hover:bg-gray-900 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 3. Kolom Pencarian (Mengisi Ruang Kosong di Tengah) */}
        <div className="flex-1 md:flex-none md:w-64 px-1 md:px-0">
          <form onSubmit={handleSearch} className="relative group w-full">
            <input
              type="text"
              placeholder="CARI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-2 border-gray-900 md:border-transparent focus:border-gray-900 focus:bg-white outline-none h-9 md:h-10 px-2 md:px-4 pl-8 md:pl-10 text-[11px] md:text-xs font-mono font-bold tracking-widest text-gray-900 placeholder:text-gray-500 transition-all rounded-none"
            />
            <button type="submit" className="absolute left-2 md:left-3 top-2.5 md:top-3 text-gray-500 hover:text-gray-900">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 4. Ikon Navigasi & Auth (Hanya Mobile) */}
        <div className="flex md:hidden items-center gap-1 flex-shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-9 h-9 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all ${
                  isActive ? "bg-gray-900 text-white" : "bg-white text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
          
          {isLoggedIn ? (
            <div className="w-9 h-9 border-2 border-gray-900 bg-gray-200 overflow-hidden flex-shrink-0">
              <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-full h-full object-cover" />
            </div>
          ) : (
            <Link
              href="/login"
              className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-900 text-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* 5. Autentikasi Teks (Hanya Desktop) */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Selamat Datang,</p>
                <p className="font-black text-sm uppercase tracking-tighter leading-none group-hover:text-gray-500 transition-colors">Reader One</p>
              </div>
              <div className="w-10 h-10 border-2 border-gray-900 bg-gray-200 overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-100 font-mono text-xs font-bold uppercase tracking-widest py-2.5 px-6 flex items-center gap-2 transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}