"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // Import Supabase
import { 
  ArrowLeft, Check, Crown, Sparkles, ShieldCheck, 
  CreditCard, RefreshCcw, XCircle, Loader2
} from "lucide-react";

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // State untuk loading saat memanggil API Midtrans
  const [isProcessing, setIsProcessing] = useState(false);

  // FUNGSI UNTUK MEMICU MIDTRANS
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Ambil data user yang sedang login dari Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Silakan login terlebih dahulu untuk berlangganan!");
        return;
      }

      // 2. Tembak API backend kita (api/checkout) untuk minta Token Midtrans
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: billingCycle,
          userId: session.user.id,
          email: session.user.email,
        }),
      });
      
      const data = await res.json();
      
      // 3. Jika token didapat, munculkan Pop-up Midtrans
      if (data.token) {
        // @ts-ignore (Mengabaikan error TypeScript karena window.snap berasal dari script luar)
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            alert("Pembayaran Berhasil! Akun Anda sekarang Premium.");
            window.location.href = "/profile"; // Arahkan ke halaman profil
          },
          onPending: function (result: any) {
            alert("Menunggu pembayaran Anda!");
          },
          onError: function (result: any) {
            alert("Pembayaran gagal, silakan coba lagi.");
          },
          onClose: function () {
            alert("Anda menutup jendela pembayaran sebelum menyelesaikannya.");
          }
        });
      } else {
        alert("Gagal mendapatkan token pembayaran dari server.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat memproses pembayaran.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-gray-900 pb-20">
      
      {/* Header Navigasi */}
      <header className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/profile" className="flex items-center text-gray-900 hover:text-amber-600 font-mono text-xs font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Link>
          <span className="font-black uppercase tracking-tighter text-xl">
            Premium Plan
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        
        {/* HERO SECTION */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border-2 border-gray-900 rounded-full mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">
            Upgrade Your <span className="bg-amber-100 px-2 border-b-4 border-amber-400">Experience</span>
          </h1>
          <p className="font-mono text-gray-600 text-sm md:text-base max-w-xl mx-auto">
            Nikmati akses tanpa batas ke seluruh katalog komik. Bebas iklan dan simpan bookmark tanpa batas.
          </p>
        </div>

        {/* TOGGLE BULANAN / TAHUNAN */}
        <div className="flex justify-center mb-12">
          <div className="bg-white border-2 border-gray-900 p-1 flex items-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setBillingCycle("monthly")}
              disabled={isProcessing}
              className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${
                billingCycle === "monthly" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              disabled={isProcessing}
              className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                billingCycle === "yearly" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tahunan <span className="bg-amber-400 text-black px-1 text-[9px]">HEMAT 20%</span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          
          {/* CARD 1: FREE */}
          <div className="bg-white border-2 border-gray-300 p-8 flex flex-col hover:border-gray-900 transition-colors">
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Free Tier</h3>
            <div className="text-4xl font-black mb-6">Rp 0 <span className="text-sm font-normal text-gray-500">/ selamanya</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-green-500" /> Baca komik gratis</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-green-500" /> Simpan hingga 10 bookmark</li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-400"><XCircle className="w-4 h-4" /> Masih ada iklan</li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-400"><XCircle className="w-4 h-4" /> Tanpa Badge Eksklusif</li>
            </ul>
            
            <button disabled className="w-full border-2 border-gray-300 text-gray-400 font-mono text-xs font-bold uppercase tracking-widest py-3 cursor-not-allowed">
              Paket Saat Ini
            </button>
          </div>

          {/* CARD 2: PREMIUM */}
          <div className="bg-white border-2 border-gray-900 p-8 flex flex-col relative shadow-[8px_8px_0px_rgba(0,0,0,1)] transform md:-translate-y-2">
            <div className="absolute top-0 right-0 bg-amber-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-b-2 border-l-2 border-gray-900">
              Paling Populer
            </div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Premium Tier
            </h3>
            <div className="text-4xl font-black mb-6">
              {billingCycle === "monthly" ? "Rp 25.000" : "Rp 240.000"} 
              <span className="text-sm font-normal text-gray-500"> / {billingCycle === "monthly" ? "bulan" : "tahun"}</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-green-500" /> Baca semua komik tanpa batas</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-green-500" /> Bebas iklan 100%</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-green-500" /> Simpan bookmark tak terbatas</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-4 h-4 text-green-500" /> Badge eksklusif di profil</li>
            </ul>
            
            {/* TOMBOL PEMBAYARAN YANG SUDAH TERHUBUNG KE MIDTRANS */}
            <button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gray-900 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 hover:bg-amber-500 hover:text-black transition-colors border-2 border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                </>
              ) : (
                "Lanjut ke Pembayaran"
              )}
            </button>
          </div>

        </div>

        {/* KEBIJAKAN & KEUNTUNGAN TAMBAHAN */}
        <div className="bg-white border-2 border-gray-900 p-8 md:p-12 mb-10 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase mb-8 border-b-2 border-gray-900 pb-2 inline-block">Kebijakan Langganan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 font-bold mb-2">
                <ShieldCheck className="w-5 h-5 text-gray-900" /> Aman & Terpercaya
              </div>
              <p className="font-mono text-xs text-gray-500 leading-relaxed">
                Pembayaran diproses melalui gateway resmi yang terenkripsi. Kami tidak menyimpan data kartu kredit Anda.
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 font-bold mb-2">
                <RefreshCcw className="w-5 h-5 text-gray-900" /> Batal Kapan Saja
              </div>
              <p className="font-mono text-xs text-gray-500 leading-relaxed">
                Anda dapat membatalkan perpanjangan otomatis kapan saja melalui halaman profil. Akses tetap aktif hingga masa berlaku habis.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 font-bold mb-2">
                <CreditCard className="w-5 h-5 text-gray-900" /> Akses Instan
              </div>
              <p className="font-mono text-xs text-gray-500 leading-relaxed">
                Setelah pembayaran berhasil, fitur premium (bebas iklan, dll) akan langsung aktif saat itu juga secara otomatis.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] text-gray-400 uppercase tracking-widest">
          Dengan melanjutkan pembayaran, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi Comic Network.
        </p>

      </main>
    </div>
  );
}