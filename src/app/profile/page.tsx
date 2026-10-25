"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Sesuaikan path import dengan project Anda
import { 
  User, Mail, Crown, Shield, LogOut, ArrowLeft, 
  CheckCircle2, Loader2, Save
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    is_premium: false,
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  // 1. Fetch Data dari Supabase saat halaman dimuat
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setUser(session.user);
        setProfile({
          full_name: data.full_name || "",
          email: data.email || session.user.email || "",
          is_premium: data.is_premium || false,
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  // 2. Fungsi Update Profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: "Gagal menyimpan profil." });
    } else {
      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
    }
    setSaving(false);
  };

  // 3. Fungsi Simulasi Upgrade Langganan
  const handleUpgrade = async () => {
    const confirm = window.confirm("Apakah Anda yakin ingin berlangganan Premium? (Simulasi)");
    if (!confirm) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => ({ ...prev, is_premium: true }));
      setMessage({ type: "success", text: "Selamat! Anda sekarang Premium." });
    }
    setSaving(false);
  };

  // 4. Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] pb-20 font-sans text-gray-900">
      <header className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-900 hover:text-amber-600 font-mono font-bold text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Beranda
          </Link>
          <span className="font-black uppercase tracking-tighter text-xl">Pengaturan Akun</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10">
        
        {/* Notifikasi */}
        {message.text && (
          <div className={`mb-8 p-4 border-2 font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
            message.type === "success" ? "bg-green-100 border-green-900 text-green-900" : "bg-red-100 border-red-900 text-red-900"
          }`}>
            <CheckCircle2 className="w-5 h-5" /> {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: AVATAR & STATUS */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border-2 border-gray-900 p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gray-900"></div>
              
              <div className="relative z-10 w-24 h-24 mx-auto mt-8 bg-gray-200 border-4 border-gray-900 rounded-full flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <User className="w-10 h-10 text-gray-500" />
              </div>
              
              <h2 className="mt-4 font-black uppercase tracking-tighter text-xl">{profile.full_name || "User"}</h2>
              <p className="font-mono text-xs text-gray-500 mb-4">{profile.email}</p>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest border-2 ${
                profile.is_premium ? "bg-amber-100 border-amber-900 text-amber-900" : "bg-gray-100 border-gray-400 text-gray-600"
              }`}>
                {profile.is_premium ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {profile.is_premium ? "Premium Member" : "Free Member"}
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full bg-white border-2 border-red-900 text-red-900 font-mono font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-[4px_4px_0px_rgba(153,27,27,1)] active:shadow-none active:translate-y-1"
            >
              <LogOut className="w-4 h-4" /> Keluar Akun
            </button>
          </div>

          {/* KOLOM KANAN: FORM & LANGGANAN */}
          <div className="md:col-span-2 space-y-8">
            
            {/* SECTION 1: EDIT PROFIL */}
            <div className="bg-white border-2 border-gray-900 p-6 md:p-8 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2 border-b-2 border-gray-900 pb-4">
                <User className="w-6 h-6" /> Informasi Pribadi
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full bg-white border-2 border-gray-900 text-gray-900 font-mono text-sm py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-widest text-gray-900 mb-2">Email (Tidak dapat diubah)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full bg-gray-100 border-2 border-gray-400 text-gray-500 font-mono text-sm py-3 pl-12 pr-4 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gray-900 text-white font-mono font-bold uppercase tracking-widest py-3 px-8 flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </form>
            </div>

            {/* SECTION 2: LANGGANAN (SUBSCRIPTION) */}
            <div className={`bg-white border-2 p-6 md:p-8 shadow-[6px_6px_0px_rgba(0,0,0,1)] ${
              profile.is_premium ? "border-amber-500" : "border-gray-900"
            }`}>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2 border-b-2 border-gray-900 pb-4">
                <Crown className="w-6 h-6 text-amber-500" /> Status Langganan
              </h3>

              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className={`flex-1 p-6 border-2 ${
                  profile.is_premium 
                    ? "bg-amber-50 border-amber-900" 
                    : "bg-gray-50 border-gray-300"
                }`}>
                  <h4 className="font-black text-xl uppercase mb-2">
                    {profile.is_premium ? "Premium Plan" : "Free Plan"}
                  </h4>
                  <p className="font-mono text-sm text-gray-600 mb-4">
                    {profile.is_premium 
                      ? "Akses tanpa batas, bebas iklan, dan baca chapter lebih awal." 
                      : "Akses standar dengan batasan harian dan iklan."}
                  </p>
                  <ul className="space-y-2 font-mono text-xs text-gray-700">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Baca Semua Komik</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Simpan Bookmark Tanpa Batas</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Tanpa Iklan</li>
                  </ul>
                </div>

                <div className="w-full md:w-auto">
                  {profile.is_premium ? (
                    <button disabled className="w-full bg-gray-200 border-2 border-gray-400 text-gray-500 font-mono font-bold uppercase tracking-widest py-4 px-8 cursor-not-allowed text-center">
                      Anda Sudah Premium
                    </button>
                  ) : (
                    <button
                      onClick={handleUpgrade}
                      disabled={saving}
                      className="w-full bg-[#d97706] border-2 border-gray-900 text-white font-mono font-bold uppercase tracking-widest py-4 px-8 flex items-center justify-center gap-2 hover:bg-[#b45309] transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      Upgrade Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: KEAMANAN */}
            <div className="bg-white border-2 border-gray-900 p-6 md:p-8 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2 border-b-2 border-gray-900 pb-4">
                <Shield className="w-6 h-6" /> Keamanan
              </h3>
              <p className="font-mono text-sm text-gray-600 mb-4">
                Ingin mengganti password atau mengelola keamanan akun? Klik tombol di bawah ini.
              </p>
              <button 
                onClick={() => alert("Fitur ganti password akan segera hadir!")}
                className="bg-white border-2 border-gray-900 text-gray-900 font-mono font-bold uppercase tracking-widest py-3 px-6 hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
              >
                Ubah Password
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}