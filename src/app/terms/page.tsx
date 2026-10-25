import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] font-sans text-gray-900 selection:bg-amber-500 selection:text-white">
      <Header />
      
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-12">
        {/* Header Halaman */}
        <div className="mb-10 border-b-2 border-gray-900 pb-6 flex items-center gap-4">
          <Scale className="w-10 h-10 md:w-14 md:h-14 text-gray-900" />
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Terms of Service
            </h1>
            <p className="font-mono text-sm mt-2 text-gray-500 uppercase tracking-widest">
              Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Konten */}
        <div className="bg-white border-2 border-gray-900 p-6 md:p-10 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-8 text-gray-700 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">1. Penerimaan Syarat</h2>
            <p>
              Dengan mengakses dan menggunakan <strong>Comic Network</strong>, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, mohon untuk tidak menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">2. Penggunaan Layanan</h2>
            <p className="mb-3">Anda setuju untuk menggunakan situs ini hanya untuk tujuan yang sah dan pribadi. Anda dilarang:</p>
            <ul className="list-disc pl-6 space-y-2 font-mono text-sm">
              <li>Menggunakan *scraper* otomatis atau bot untuk mengambil data dalam jumlah besar dari situs ini.</li>
              <li>Mencoba meretas, membebani server secara berlebihan, atau mengganggu layanan.</li>
              <li>Menggunakan layanan untuk menyebarkan malware atau konten ilegal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">3. Hak Cipta & Konten</h2>
            <p>
              Comic Network adalah platform agregator. Kami <strong>tidak memiliki</strong> hak cipta atas komik, gambar, atau konten yang ditampilkan di situs ini. Semua gambar dan chapter disediakan oleh pihak ketiga (MangaDex, Komiku, dll). Kami tidak menyimpan file gambar secara permanen di server kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">4. Akun Pengguna</h2>
            <p>
              Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi akun Anda. Kami tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Anda dalam menjaga keamanan akun.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">5. Penafian (Disclaimer)</h2>
            <p>
              Layanan ini disediakan "sebagaimana adanya" (as is). Kami tidak menjamin bahwa situs akan selalu berjalan tanpa gangguan, bebas dari *error*, atau bahwa semua data chapter akan selalu tersedia dan terbaru.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black uppercase mb-3 text-gray-900">6. Perubahan Syarat</h2>
            <p>
              Kami berhak untuk mengubah Syarat dan Ketentuan ini kapan saja. Perubahan akan berlaku segera setelah diposting di halaman ini. Penggunaan Anda yang berkelanjutan atas situs ini merupakan persetujuan Anda terhadap syarat yang diperbarui.
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