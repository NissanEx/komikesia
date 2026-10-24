import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { getMangaBySearch } from "@/lib/mangadex";
import ComicGrid from "@/components/ComicGrid";

// ==========================================
// 1. Komponen Header Dinamis (Membaca Search Query)
// ==========================================
async function SearchHeader({ searchParamsPromise }: { searchParamsPromise: Promise<{ q?: string }> }) {
  const { q } = await searchParamsPromise;
  const query = q?.trim() || "";

  return (
    <div className="mb-10 border-b-2 border-gray-900 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <SearchIcon className="w-4 h-4" /> Hasil Pencarian
        </p>
        {/* Jika ada query, tampilkan query. Jika kosong, tampilkan "PENCARIAN" */}
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none break-words">
          {query ? `"${query}"` : "PENCARIAN"}
        </h1>
      </div>
    </div>
  );
}

// ==========================================
// 2. Komponen Hasil Pencarian
// ==========================================
async function SearchResults({ searchParamsPromise }: { searchParamsPromise: Promise<{ q?: string }> }) {
  const { q } = await searchParamsPromise;
  const query = q?.trim() || "";

  if (!query) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-gray-300 bg-white">
        <p className="font-mono text-sm uppercase tracking-widest text-gray-500">
          Ketik judul komik di kolom pencarian.
        </p>
      </div>
    );
  }

  const comics = await getMangaBySearch(query);

  if (!comics || comics.length === 0) {
    return (
      <div className="text-center py-24 border-2 border-gray-900 bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-gray-900">
          404 // Tidak Ditemukan
        </h2>
        <p className="font-mono text-sm text-gray-600 mb-8 max-w-md mx-auto">
          Sistem tidak menemukan komik yang cocok dengan kata kunci <strong className="text-gray-900">"{query}"</strong>. Coba gunakan ejaan atau judul alternatif.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white font-mono font-bold uppercase tracking-widest py-3 px-6 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return <ComicGrid initialComics={comics} />;
}

// ==========================================
// 3. Halaman Utama (Sinkron)
// ==========================================
export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f4] text-gray-900 font-sans pb-20 selection:bg-amber-500 selection:text-white">
      
      <header className="border-b border-gray-300 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between font-mono text-xs uppercase tracking-widest">
          <Link href="/" className="flex items-center gap-2 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="text-gray-400">Komik Setya / Pencarian</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Bungkus Header dengan Suspense agar judul bisa berubah sesuai query */}
        <Suspense fallback={
          <div className="mb-10 border-b-2 border-gray-900 pb-6">
            <div className="w-32 h-4 bg-gray-200 animate-pulse mb-4 rounded-none"></div>
            <div className="w-1/2 h-16 bg-gray-200 animate-pulse rounded-none"></div>
          </div>
        }>
          <SearchHeader searchParamsPromise={searchParams} />
        </Suspense>

        {/* Bungkus Hasil dengan Suspense */}
        <Suspense 
          fallback={
            <div className="animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-72 border border-gray-300"></div>
                ))}
              </div>
            </div>
          }
        >
          <SearchResults searchParamsPromise={searchParams} />
        </Suspense>

      </main>
    </div>
  );
}