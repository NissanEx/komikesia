"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// PERBAIKAN: Tambahkan CheckCircle2 ke dalam import
import { Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Proses Daftar ke Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name, // Menyimpan nama ke dalam metadata user
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      setSuccessMsg("Registrasi berhasil! Silakan cek email Anda untuk verifikasi, atau langsung login jika verifikasi dimatikan.");
      setIsLoading(false);
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-row-reverse">
      {/* KANAN: FORM REGISTER */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 py-12 relative z-10 bg-[#f4f4f4]">
        <Link 
          href="/" 
          className="absolute top-8 right-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-mono text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Kembali <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-gray-900 mb-2">
              Buat Akun
            </h1>
            <p className="font-mono text-sm text-gray-500">
              Bergabunglah dengan ribuan pembaca lainnya.
            </p>
          </div>

          {/* Notifikasi Error / Sukses */}
          {errorMsg && (
            <div className="mb-6 bg-red-100 border-2 border-red-900 text-red-900 p-3 font-mono text-xs font-bold uppercase flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 bg-green-100 border-2 border-green-900 text-green-900 p-3 font-mono text-xs font-bold uppercase flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                  placeholder="Nama Anda"
                />
              </div>
            </div>

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
                  placeholder="email@contoh.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                  placeholder="Buat password (min. 6 karakter)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#d97706] text-white font-mono font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#b45309] transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-y-1 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Daftar Akun"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center font-mono text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-amber-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>

      {/* KIRI: VISUAL BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-[#111] relative overflow-hidden items-center justify-center border-r-2 border-gray-900">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-amber-500 mx-auto mb-8 shadow-[8px_8px_0px_rgba(255,255,255,0.2)] flex items-center justify-center">
            <span className="text-4xl font-black text-gray-900">CN</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-white/10 uppercase tracking-tighter leading-none select-none">
            BERGABUNG<br/>SEKARANG
          </h2>
          <p className="mt-6 text-gray-400 font-mono text-sm tracking-widest uppercase">
            Simpan bookmark, kelola koleksi, dan baca tanpa batas.
          </p>
        </div>
      </div>
    </div>
  );
}