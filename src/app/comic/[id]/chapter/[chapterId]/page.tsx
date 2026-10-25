import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { getChapterImages, getMangaChapters } from "@/lib/mangadex";
import { getComickChapterPages } from "@/lib/comick";
import { getKomikuChapterPages } from "@/lib/komiku";
import ContinuousReader from "@/components/ContinuousReader";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; chapterId: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const comicTitle = decodeURIComponent(id).split("/").pop()?.replace(/-/g, " ") || "Komik";
  
  return {
    title: `Baca Chapter - ${comicTitle}`,
    description: `Baca chapter terbaru dari ${comicTitle} dengan kualitas gambar terbaik hanya di KomikNet.`,
    robots: {
      index: false, // Disarankan 'false' agar Google tidak mengindeks halaman baca (mencegah duplikat)
    }
  };
}function decodeUrlSafe(str: string): string {
  let decoded = str;
  try { decoded = decodeURIComponent(decoded); } catch(e) {}
  
  while (/^[A-Za-z0-9+/=]+$/.test(decoded)) {
    try {
      const next = atob(decoded);
      if (!next) break;
      decoded = next;
    } catch(e) {
      break;
    }
  }
  
  try { decoded = decodeURIComponent(decoded); } catch(e) {}
  return decoded;
}

async function ReaderContent({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string; chapterId: string }>;
  searchParams: Promise<{ source?: string; mangaUrl?: string }>;
}) {
  const { id, chapterId } = await params;
  const { source } = await searchParams;

  // ==========================================
  // LOGIKA SUMBER ALTERNATIF
  // ==========================================
  if (source) {
    let images: string[] = [];
    
    let finalChapterUrl = decodeUrlSafe(chapterId);

    try {
      // Hanya menyisakan Komiku dan Comick
      if (source === "komiku") { 
        images = await getKomikuChapterPages(finalChapterUrl);
      } else {
        images = await getComickChapterPages(finalChapterUrl, source);
      }
    } catch (err) {
      console.log(`[READER] Gagal ambil gambar dari ${source}:`, err);
    }

    if (!images || images.length === 0) {
      return <ErrorState id={id} message={`Gagal memuat gambar dari ${source}. Server sumber sedang membatasi akses atau scrapper-nya error.`} />;
    }

    return (
      <main className="max-w-3xl mx-auto px-0 md:px-4 py-0 md:py-8 flex flex-col items-center">
        {images.map((imgUrl: string, index: number) => (
          <img 
            key={index} 
            src={`/api/image?url=${encodeURIComponent(imgUrl)}`} 
            alt={`Halaman ${index + 1}`}
            className="w-full max-w-full h-auto mb-1 md:mb-2 bg-white" 
            loading="lazy"
          />
        ))}
        
        <div className="w-full py-16 flex flex-col items-center justify-center border-t-2 border-gray-900 mt-8 bg-white font-mono text-center">
          <h2 className="font-black text-gray-900 text-2xl uppercase tracking-tighter mb-2">
            Akhir Chapter
          </h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">
            Anda telah mencapai akhir chapter dari {source}
          </p>
          <Link 
            href={`/comic/${id}`} 
            className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Kembali ke Detail
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // LOGIKA UTAMA (MangaDex)
  // ==========================================
  const result = await getChapterImages(chapterId);
  
  if (result.externalUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-mono bg-[#f4f4f4]">
        <div className="bg-white border-2 border-gray-900 p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-lg">
          <ExternalLink className="w-12 h-12 text-gray-900 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase mb-2">Chapter Eksternal</h1>
          <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
            Chapter ini tidak tersedia langsung. Silakan baca di situs resmi penerbitnya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/comic/${id}`} className="border-2 border-gray-900 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition">
              Kembali
            </Link>
            <a href={result.externalUrl} target="_blank" rel="noopener noreferrer" className="bg-[#d97706] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#b45309] transition">
              Baca di Situs Resmi
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!result.images || result.images.length === 0) {
    return <ErrorState id={id} message="Server gambar gagal dihubungi." />;
  }

  let nextChapterId = null;
  try {
    const chaptersData = await getMangaChapters(id);
    const allChapters = chaptersData?.data || [];
    const sortedChapters = [...allChapters].sort(
      (a: any, b: any) => (parseFloat(a.attributes.chapter) || 0) - (parseFloat(b.attributes.chapter) || 0)
    );
    const currentIndex = sortedChapters.findIndex((c: any) => c.id === chapterId);
    if (currentIndex !== -1 && currentIndex < sortedChapters.length - 1) {
      nextChapterId = sortedChapters[currentIndex + 1].id;
    }
  } catch (error) {}

  const initialData = {
    chapterId,
    chapterNumber: result.chapterNumber,
    images: result.images,
    externalUrl: null,
    nextChapterId
  };

  return <ContinuousReader initialData={initialData} mangaId={id} />;
}

// ==========================================
// Komponen Error
// ==========================================
function ErrorState({ id, message }: { id: string, message: string }) {
  let decodedId = id;
  try { decodedId = decodeURIComponent(id); } catch(e) {}
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-mono bg-[#f4f4f4]">
      <div className="bg-white border-2 border-gray-900 p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-lg">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black uppercase mb-2">Gagal Memuat Gambar</h1>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
        <Link href={`/comic/${decodedId}`} className="inline-block bg-gray-900 text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-gray-700 transition">Kembali ke Detail</Link>
      </div>
    </div>
  );
}

// ==========================================
// Halaman Utama
// ==========================================
export default function ChapterReaderPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string; chapterId: string }>;
  searchParams: Promise<{ source?: string; mangaUrl?: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f4] pb-0 font-sans">
      <header className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-900 hover:text-amber-600 font-mono font-bold text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />Kembali
          </Link>
        </div>
      </header>
      
      <Suspense fallback={
        <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-900" />
          Memuat Gambar...
        </div>
      }>
        <ReaderContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}