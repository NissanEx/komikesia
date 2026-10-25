"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Import Supabase
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Proses Login ke Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      // Jika berhasil, arahkan ke halaman profil
      router.push("/profile");
      router.refresh(); // Refresh state server agar header berubah
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex">
      {/* KIRI: FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 py-12 relative z-10 bg-[#f4f4f4]">
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-mono text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
            <div className="bg-gray-900 text-white w-12 h-12 flex items-center justify-center font-black text-xl mb-6 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              CN
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-gray-900 mb-2">
              Sign In
            </h1>
            <p className="font-mono text-sm text-gray-500">
              Lanjutkan untuk mengakses koleksi komik Anda.
            </p>
          </div>

          {/* Notifikasi Error */}
          {errorMsg && (
            <div className="mb-6 bg-red-100 border-2 border-red-900 text-red-900 p-3 font-mono text-xs font-bold uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900">
                  Password
                </label>
                <Link href="#" className="font-mono text-xs text-amber-600 hover:text-amber-700 hover:underline">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                  placeholder="Masukkan password Anda"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white font-mono font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center font-mono text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="text-amber-600 font-bold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* KANAN: VISUAL BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-[#111] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 text-center px-12">
          <h2 className="text-6xl md:text-8xl font-black text-white/10 uppercase tracking-tighter leading-none select-none">
            KOMIK<br/>SETYA
          </h2>
          <div className="mt-8 border-2 border-amber-500 p-6 bg-[#111]/80 backdrop-blur-sm shadow-[8px_8px_0px_rgba(217,119,6,0.5)]">
            <p className="font-serif text-xl italic text-gray-300">
              "Baca ribuan komik, manga, manhwa, dan manhua dari berbagai sumber dalam satu platform."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}