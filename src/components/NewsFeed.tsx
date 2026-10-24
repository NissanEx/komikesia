import Link from "next/link";
import { getPopularManga } from "@/lib/mangadex";

export default async function NewsFeed() {
  // Ambil data MangaDex (sekarang mengembalikan objek { data, total })
  const res = await getPopularManga();
  const comics = res.data;
  
  // Ambil 5 komik teratas
  const topComics = comics.slice(0, 5);

  return (
    <div className="w-full mt-12">
      <div className="flex justify-between items-end border-b-2 border-gray-900 pb-2 mb-4">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-gray-900">
          Populer Mingguan
        </h2>
        <Link href="/katalog" className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-amber-600 transition-colors mb-1">
          Lihat Semua
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {topComics.length > 0 ? (
          topComics.map((comic: any) => (
            <Link 
              href={`/comic/${comic.id}`} 
              key={comic.id} 
              className="flex gap-4 group items-center"
            >
              <div className="w-20 h-28 flex-shrink-0 bg-white border-2 border-gray-900 shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:shadow-none group-hover:translate-x-[3px] group-hover:translate-y-[3px] overflow-hidden">
                <img 
                  src={`/api/image?url=${encodeURIComponent(comic.img)}`} 
                  alt={comic.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
              </div>

              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h3 className="font-black text-sm md:text-base text-gray-900 uppercase leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors mb-1">
                  {comic.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 mt-1">
                  <span className="bg-gray-100 border border-gray-300 px-1.5 py-0.5">{comic.type}</span>
                  <span className="w-1 h-1 bg-gray-400"></span>
                  <span className="font-bold">{comic.chapters} Ch.</span>
                  <span className="w-1 h-1 bg-gray-400"></span>
                  <span className="text-amber-600 font-bold">★ {comic.rating}.0</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 font-mono text-xs border-2 border-dashed border-gray-300">
            Gagal memuat data.
          </div>
        )}
      </div>
    </div>
  );
}