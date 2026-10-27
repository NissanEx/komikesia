// src/components/HeaderClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Search, LogIn, Home, LayoutGrid, Bookmark, User, LogOut } from "lucide-react";

export default function HeaderClient({ initialUser }: { initialUser: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Beranda", href: "/", icon: Home },
    { name: "Katalog", href: "/katalog", icon: LayoutGrid },
    { name: "Bookmark", href: "/bookmark", icon: Bookmark },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isLoggedIn = !!initialUser;

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b-2 border-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 md:px-4 h-16 md:h-20 flex flex-row items-center justify-between gap-2 md:gap-6">
        
        {/* 1. Logo KN */}
        <Link 
          href="/" 
          className="bg-gray-900 text-white w-9 h-9 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] md:shadow-[3px_3px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all duration-200 ease-out"
        >
          <span className="text-sm md:text-xl font-black tracking-tighter">KN</span>
        </Link>

        {/* 2. Navigasi Teks (Hanya Desktop) */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest flex-shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                // REVISI: Menambahkan transisi warna dan efek hover yang lebih halus
                className={`px-4 py-2 transition-all duration-200 ease-out ${
                  isActive 
                    ? "bg-gray-900 text-white shadow-[2px_2px_0px_rgba(217,119,6,1)]" 
                    : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 3. Kolom Pencarian */}
        <div className="flex-1 md:flex-none md:w-64 px-1 md:px-0">
          <form onSubmit={handleSearch} className="relative group w-full">
            <input
              type="text"
              placeholder="CARI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // REVISI: Fokus ring animasi dibuat lebih halus
              className="w-full bg-gray-100 border-2 border-transparent focus:border-gray-900 focus:bg-white outline-none h-9 md:h-10 px-2 md:px-4 pl-8 md:pl-10 text-[11px] md:text-xs font-mono font-bold tracking-widest text-gray-900 placeholder:text-gray-500 transition-all duration-300 rounded-none"
            />
            <button type="submit" className="absolute left-2 md:left-3 top-2.5 md:top-3 text-gray-500 group-focus-within:text-gray-900 transition-colors duration-200">
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
                className={`w-9 h-9 flex items-center justify-center border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all duration-200 ease-out ${
                  isActive ? "bg-gray-900 text-white shadow-[2px_2px_0px_rgba(217,119,6,1)]" : "bg-white text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
          
          {isLoggedIn ? (
            <Link href="/profile" className="w-9 h-9 flex items-center justify-center bg-amber-500 border-2 border-gray-900 text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all duration-200">
              <User className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-900 text-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* 5. Autentikasi Teks (Hanya Desktop) */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right">
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1 group-hover:text-gray-900 transition-colors">Profil Saya</p>
                  <p className="font-black text-sm uppercase tracking-tighter leading-none group-hover:text-amber-600 transition-colors">Pengaturan</p>
                </div>
                <div className="w-10 h-10 border-2 border-gray-900 bg-amber-100 flex items-center justify-center transition-all duration-200 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] group-hover:-translate-y-[2px] group-hover:-translate-x-[2px]">
                  <User className="w-5 h-5" />
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="w-10 h-10 border-2 border-red-900 bg-white text-red-900 flex items-center justify-center hover:bg-red-900 hover:text-white transition-all duration-200 shadow-[2px_2px_0px_rgba(153,27,27,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              // REVISI PENTING: 
              // Bayangan diubah dari hitam pekat ke warna Amber agar tidak terlihat seperti tombol kedua.
              // Ditambahkan efek transisi dan active:scale agar terasa "ditekan".
              className="bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50 font-mono text-xs font-bold uppercase tracking-widest py-2.5 px-6 flex items-center gap-2 transition-all duration-200 ease-out shadow-[3px_3px_0px_rgba(217,119,6,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] active:scale-95"
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