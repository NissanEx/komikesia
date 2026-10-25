import Link from "next/link";
import { getPopularManga } from "@/lib/mangadex";
import { getAnilistPopularManga } from "@/lib/anilist";
import { getKomikuPopularManga } from "@/lib/komiku";

export default async function NewsFeed() {
  // Ambil data dari 3 sumber
  const [mdxRes, aniData, komikuRes] = await Promise.all([
    getPopularManga(),
    getAnilistPopularManga(),
    getKomikuPopularManga(1)
  ]);

  const mdxData = mdxRes.data || [];
  const komikuData = komikuRes.data || [];
  
  // Gabungkan dan ambil 5 teratas
  const combined = [...mdxData, ...aniData, ...komikuData];
  const topComics = combined.slice(0, 5);

  return (
    <div className="w-full mt-12">
      <div className="flex justify-between items-end border-b-2 border-gray-900 pb-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900">
          Populer Mingguan
        </h2>
        <Link href="/katalog" className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-amber-600 transition-colors mb-1">
          Lihat Semua
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {topComics.length > 0 ? (
          topComics.map((comic: any) => {
            // Tentukan badge sumber
            let sourceBadge = null;
            if (comic.source === "komiku") {
              sourceBadge = <span className="bg-green-600 text-white px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest">Komiku</span>;
            } else if (comic.source === "anilist") {
              sourceBadge = <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest">AniList</span>;
            }

            return (
              <Link 
                href={`/comic/${comic.id}`} 
                key={comic.id} 
                className="flex gap-6 group items-center"
              >
                {/* SAMPUL BESAR (Sama dengan Sidebar) */}
                <div className="w-24 h-36 md:w-32 md:h-48 flex-shrink-0 bg-white border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] overflow-hidden">
                  <img 
                    src={`/api/image?url=${encodeURIComponent(comic.img)}`} 
                    alt={comic.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                </div>

                {/* Teks Kanan (Diperbesar) */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
                    {sourceBadge}
                    <h3 className="font-black text-lg md:text-2xl text-gray-900 uppercase leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {comic.title}
                    </h3>
                  </div>
                  
                  {/* Info Chapter & Rating */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 font-mono text-xs md:text-sm uppercase tracking-widest text-gray-500">
                    <span className="bg-white border-2 border-gray-300 px-2 py-0.5">
                      {comic.chapters && comic.chapters !== "?" ? comic.chapters : "-"} Ch.
                    </span>
                    <span className="w-1.5 h-1.5 bg-gray-400"></span>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      ★ {comic.rating || 0}.0
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-6 text-gray-500 font-mono text-xs border-2 border-dashed border-gray-300">
            Gagal memuat data.
          </div>
        )}
      </div>
    </div>
  );
}