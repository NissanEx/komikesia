import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] font-sans text-gray-900 selection:bg-amber-500 selection:text-white">
      <Header />
      
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-12">
        {/* Header Halaman */}
        <div className="mb-10 border-b-2 border-gray-900 pb-6 flex items-center gap-4">
          <Shield className="w-10 h-10 md:w-14 md:h-14 text-gray-900" />
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Privacy Policy
            </h1>
            <p className="font-mono text-sm mt-2 text-gray-500 uppercase tracking-widest">
              Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Konten */}
        <div className="bg-white border-2 border-gray-900 p-6 md:p-10 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-8 text-gray-700 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">1. Pendahuluan</h2>
            <p>
              Selamat datang di <strong>Comic Network</strong>. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda bagikan kepada kami saat menggunakan situs web kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">2. Informasi yang Kami Kumpulkan</h2>
            <p className="mb-3">Kami dapat mengumpulkan beberapa jenis informasi, termasuk:</p>
            <ul className="list-disc pl-6 space-y-2 font-mono text-sm">
              <li><strong>Informasi Akun:</strong> Alamat email dan kata sandi (yang dienkripsi) saat Anda mendaftar atau masuk menggunakan Google Auth/Supabase.</li>
              <li><strong>Data Penggunaan:</strong> Informasi tentang komik yang Anda simpan ke Bookmark atau riwayat komik yang Anda baca.</li>
              <li><strong>Data Teknis:</strong> Alamat IP, jenis browser, dan data cookie untuk meningkatkan pengalaman menjelajah Anda.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">3. Penggunaan Informasi</h2>
            <p className="mb-3">Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-6 space-y-2 font-mono text-sm">
              <li>Menyediakan dan memelihara fungsionalitas situs (seperti fitur Bookmark).</li>
              <li>Memproses autentikasi (login) Anda.</li>
              <li>Memahami bagaimana pengguna menggunakan situs kami untuk perbaikan berkelanjutan.</li>
              <li>Mencegah aktivitas penipuan atau penyalahgunaan layanan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">4. Keamanan Data</h2>
            <p>
              Kami menggunakan layanan pihak ketiga (Supabase) untuk menangani autentikasi dan penyimpanan data. Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda. Namun, perlu diingat bahwa tidak ada metode transmisi data melalui internet yang 100% aman.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">5. Berbagi Informasi</h2>
            <p>
              Kami <strong>tidak akan pernah menjual</strong> data pribadi Anda kepada pihak ketiga. Kami hanya membagikan data kepada penyedia layanan infrastruktur (seperti Vercel dan Supabase) yang membantu kami menjalankan situs ini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">6. Hak Anda</h2>
            <p>
              Anda berhak untuk meminta penghapusan akun dan data pribadi Anda kapan saja. Jika Anda menghapus bookmark, data tersebut akan dihapus dari database kami secara permanen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">7. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui Instagram <a href="https://www.instagram.com/p/DezUBh2OPgE/#" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-600 hover:underline">SANDY W</a>.
            </p>
          </section>

        </div>

        {/* Tombol Kembali */}
        <div className="mt-10 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 px-8 transition-colors hover:bg-amber-600 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}