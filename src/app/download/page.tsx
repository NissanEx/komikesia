import Link from "next/link";
import { ArrowLeft, Download, ShieldCheck, Smartphone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] font-sans text-gray-900 selection:bg-amber-500 selection:text-white">
      <Header />
      
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        
        <div className="bg-white border-2 border-gray-900 p-8 md:p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-2xl w-full">
          <div className="w-20 h-20 bg-amber-500 border-2 border-gray-900 mx-auto flex items-center justify-center mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <Smartphone className="w-10 h-10 text-black" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Comic Network <br/> Android
          </h1>
          
          <p className="font-mono text-gray-600 mb-8 max-w-md mx-auto">
            Versi 1.0.0 • 15 MB <br/>
            Unduh aplikasi untuk pengalaman membaca yang lebih cepat, mulus, dan tanpa batas.
          </p>

          {/* Ganti '#' dengan link file APK asli Anda nanti */}
          <a 
            href="#" 
            className="inline-flex w-full md:w-auto items-center justify-center gap-3 bg-gray-900 text-white font-mono font-bold uppercase tracking-widest py-4 px-10 hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1"
          >
            <Download className="w-5 h-5" />
            Unduh APK Sekarang
          </a>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            100% Aman & Bebas Virus
          </div>
        </div>

        <Link href="/" className="mt-10 flex items-center text-gray-500 hover:text-gray-900 font-mono text-sm uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
        </Link>
      </main>
      
      <Footer />
    </div>
  );
}