import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getMangaById, getMangaChapters } from "@/lib/mangadex";

// 1. Komponen terpisah untuk mengambil dan menampilkan data (Async Component)
async function ComicDetails({ id }: { id: string }) {
  const mangaData = await getMangaById(id);
  const chaptersData = await getMangaChapters(id);

  if (!mangaData || !mangaData.data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gagal Memuat Data</h1>
        <p className="text-gray-500 mb-6">Komik tidak ditemukan atau koneksi ke server terputus.</p>
        <Link href="/" className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-700 transition">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const manga = mangaData.data;
  const title = manga.attributes.title.en || manga.attributes.title["ja-ro"] || "Judul Tidak Diketahui";
  const description = manga.attributes.description.en || "Belum ada deskripsi untuk komik ini.";
  
  const coverArt = manga.relationships.find((rel: any) => rel.type === "cover_art");
  const coverUrl = coverArt 
    ? `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}` 
    : "https://via.placeholder.com/400x600?text=No+Image";

  const chapters = chaptersData?.data || [];

  return (
    <>
      {/* BAGIAN INFO KOMIK */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <img 
            src={coverUrl} 
            alt={title} 
            className="w-full aspect-[3/4] object-cover rounded-lg shadow-md border border-gray-100"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {manga.attributes.tags.slice(0, 5).map((tag: any) => (
              <span key={tag.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider">
                {tag.attributes.name.en}
              </span>
            ))}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6 line-clamp-6">
            {description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
              <p className="font-bold text-gray-900 capitalize">{manga.attributes.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Tahun</p>
              <p className="font-bold text-gray-900">{manga.attributes.year || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN DAFTAR CHAPTER */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Daftar Chapter
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {chapters.length > 0 ? (
            chapters.map((chapter: any) => (
              <div key={chapter.id} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">
                    Chapter {chapter.attributes.chapter || "?"}
                    {chapter.attributes.title && `: ${chapter.attributes.title}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dirilis: {new Date(chapter.attributes.publishAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-900 hover:text-white transition">
                  Baca
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              Belum ada chapter yang tersedia (atau API gagal memuat).
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 2. Komponen Halaman Utama (Default Export)
export default async function ComicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-12">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center text-gray-500 hover:text-gray-900 transition font-semibold text-sm">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 3. BUNGKUS DENGAN SUSPENSE (Kunci agar build Vercel berhasil) */}
        <Suspense 
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-500 font-medium">Memuat detail komik...</p>
            </div>
          }
        >
          <ComicDetails id={id} />
        </Suspense>
      </main>
    </div>
  );
}