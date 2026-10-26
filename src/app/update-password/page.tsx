"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Cek apakah user benar-benar datang dari link reset password (punya session)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Link tidak valid atau sudah kedaluwarsa. Silakan minta link baru.");
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Password dan Konfirmasi Password tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccessMsg("Password berhasil diperbarui! Anda akan dialihkan ke halaman profil dalam 3 detik.");
      
      setTimeout(() => {
        router.push("/profile");
      }, 3000);
      
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal memperbarui password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-gray-900 p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">
            Password Baru
          </h1>
          <p className="font-mono text-sm text-gray-500">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-100 border-2 border-red-900 text-red-900 p-3 font-mono text-xs font-bold uppercase flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-green-100 border-2 border-green-900 text-green-900 p-3 font-mono text-xs font-bold uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
              Password Baru
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
                className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ketik ulang password baru"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-amber-500 text-black font-mono font-bold uppercase tracking-widest py-3 px-4 flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-y-1 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Password"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}