import { Suspense } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { getMangaBySearch } from "@/lib/mangadex";
import { searchKomiku } from "@/lib/komiku";
import { getAnilistMangaBySearch } from "@/lib/anilist";
import ComicGrid from "@/components/ComicGrid";
// HAPUS: import Header from "@/components/Header";

async function SearchHeader({ searchParamsPromise }: { searchParamsPromise: Promise<{ q?: string }> }) {
  const { q } = await searchParamsPromise;
  const query = q?.trim() || "";

  return (
    <div className="mb-10 border-b-2 border-gray-900 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <SearchIcon className="w-4 h-4" /> Hasil Pencarian
        </p>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none break-words">
          {query ? `"${query}"` : "PENCARIAN"}
        </h1>
      </div>
    </div>
  );
}

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

  // Panggil semua sumber secara paralel
  const searchResults = await Promise.allSettled([
    getMangaBySearch(query),
    searchKomiku(query),
    getAnilistMangaBySearch(query)
  ]);

  let combined: any[] = [];

  // 1. MangaDex
  const mdxData = (searchResults[0].status === "fulfilled" ? searchResults[0].value : []).map((c: any) => ({ ...c, source: "mangadex" }));
  combined.push(...mdxData);

  // 2. Komiku
  const komikuData = (searchResults[1].status === "fulfilled" ? searchResults[1].value : []).map((c: any) => ({ ...c, source: "komiku" }));
  combined.push(...komikuData);

 // Cari bagian ini di dalam fungsi SearchResults:
const aniRaw = searchResults[2].status === "fulfilled" ? searchResults[2].value : [];
const aniData = aniRaw.map((c: any) => {
  let type = "Manga";
  if (c.countryOfOrigin === "KR") type = "Manhwa";
  else if (c.countryOfOrigin === "CN" || c.countryOfOrigin === "TW") type = "Manhua";
  
  return {
    id: `anilist:${c.id}`,
    title: c.title,
    type: type,
    img: c.coverImage || "https://placehold.co/400x600/png?text=No+Image", // <-- PERBAIKAN: Pastikan property 'img' berisi string URL gambar
    rating: c.averageScore || 0,
    readers: "AniList",
    chapters: c.chapters ? String(c.chapters) : "?",
    source: "anilist"
  };
});
  combined.push(...aniData);

  // Hapus duplikat
  const seen = new Set();
  combined = combined.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  if (combined.length === 0) {
    return (
      <div className="text-center py-24 border-2 border-gray-900 bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-gray-900">
          404 // Tidak Ditemukan
        </h2>
        <p className="font-mono text-sm text-gray-600 mb-8 max-w-md mx-auto">
          Sistem tidak menemukan komik yang cocok dengan kata kunci <strong className="text-gray-900">"{query}"</strong> di semua sumber. Coba gunakan ejaan atau judul alternatif.
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

  return <ComicGrid initialComics={combined} initialQuery={query} />;
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    // REVISI: Hapus min-h-screen, gunakan w-full flex-grow
    <div className="w-full flex-grow bg-[#f4f4f4] text-gray-900 font-sans pb-12 selection:bg-amber-500 selection:text-white">
      {/* HAPUS: <Header /> */}
      
      <main className="max-w-7xl mx-auto px-4 pt-12">
        <Suspense fallback={
          <div className="mb-10 border-b-2 border-gray-900 pb-6">
            <div className="w-32 h-4 bg-gray-200 animate-pulse mb-4 rounded-none"></div>
            <div className="w-1/2 h-16 bg-gray-200 animate-pulse rounded-none"></div>
          </div>
        }>
          <SearchHeader searchParamsPromise={searchParams} />
        </Suspense>

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