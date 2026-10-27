import { Suspense, cache } from "react";
import Hero from "@/components/Hero";
import ComicGrid from "@/components/ComicGrid";
import NewsFeed from "@/components/NewsFeed";
import Sidebar from "@/components/Sidebar";
// HAPUS IMPORT FOOTER DARI SINI
import FeaturedSlider from "@/components/FeaturedSlider";
import { getPopularManga } from "@/lib/mangadex"; 
import { getAnilistPopularManga } from "@/lib/anilist";
import { getKomikuPopularManga } from "@/lib/komiku";

const getCachedMangaDex = cache(getPopularManga);
const getCachedAniList = cache(getAnilistPopularManga);
const getCachedKomiku = cache(getKomikuPopularManga);

const getHomepageData = cache(async () => {
  const results = await Promise.allSettled([
    getCachedMangaDex(),
    getCachedAniList(),
    getCachedKomiku(1)
  ]);

  return {
    mdxRes: results[0].status === "fulfilled" ? results[0].value : { data: [], total: 0 },
    aniRes: results[1].status === "fulfilled" ? results[1].value : [],
    komikuRes: results[2].status === "fulfilled" ? results[2].value : { data: [], total: 0 }
  };
});

async function HeroServer() {
  const { mdxRes, aniRes, komikuRes } = await getHomepageData();
  const combined = [...mdxRes.data, ...aniRes, ...komikuRes.data];
  
  const heroSamples = combined.slice(0, 10).map((c: any) => ({
    id: c.id,
    title: c.title,
    img: c.img,
    type: c.type || "Manga",
    rating: c.rating || c.averageScore || 0,
    chapters: c.chapters || "?"
  }));

  return <Hero mangas={heroSamples} />;
}

async function PopularComics() {
  const { mdxRes, aniRes, komikuRes } = await getHomepageData();

  const combined = [];
  const mdxData = mdxRes.data;
  const aniData = aniRes;
  const komikuData = komikuRes.data;

  let mdxIdx = 0, aniIdx = 0, komikuIdx = 0;
  let count = 0;
  const limit = 20;

  while (count < limit) {
    let added = false;
    if (mdxIdx < mdxData.length) { combined.push(mdxData[mdxIdx++]); count++; added = true; }
    if (count >= limit) break;
    if (komikuIdx < komikuData.length) { combined.push(komikuData[komikuIdx++]); count++; added = true; }
    if (count >= limit) break;
    if (aniIdx < aniData.length) { combined.push(aniData[aniIdx++]); count++; added = true; }
    if (count >= limit) break;
    if (!added) break;
  }

  const totalCombined = mdxRes.total + aniRes.length + komikuRes.total;

  return <ComicGrid initialComics={combined} total={totalCombined} />;
}

async function FeaturedServer() {
  const { mdxRes, aniRes, komikuRes } = await getHomepageData();
  const combined = [...mdxRes.data, ...aniRes, ...komikuRes.data];
  
  const sliced = combined.slice(5, 15);
  
  return <FeaturedSlider comics={sliced} />;
}

// ==========================================
// SKELETON (Tampilan saat Loading)
// ==========================================
function HeroSkeleton() {
  return (
    <div className="w-full h-[500px] md:h-[600px] bg-[#111] animate-pulse flex items-center border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="w-32 h-6 bg-gray-800 mb-6"></div>
        <div className="w-1/2 h-16 bg-gray-800 mb-4"></div>
        <div className="w-2/3 h-24 bg-gray-800 mb-8"></div>
      </div>
    </div>
  );
}

function ComicSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2 mb-8 border-b-2 border-gray-300 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-8 bg-gray-200"></div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex flex-col">
            <div className="bg-gray-200 aspect-[3/4] border-2 border-gray-300 mb-3"></div>
            <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsFeedSkeleton() {
  return (
    <div className="mt-12 animate-pulse">
      <div className="h-8 bg-gray-200 w-1/3 mb-6 border-b-2 border-gray-300 pb-4"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 border-2 border-gray-300 w-full"></div>
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-gray-200 h-80 border-2 border-gray-300"></div>
      <div className="bg-gray-200 h-64 border-2 border-gray-300"></div>
    </div>
  );
}

function SliderSkeleton() {
  return (
    <div className="py-16 bg-[#f4f4f4] w-full overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="w-48 h-8 bg-gray-300 animate-pulse mb-3"></div>
      </div>
      
      <div className="w-full flex justify-center gap-2">
        <div className="w-[120px] md:w-[160px] aspect-[3/4] bg-gray-200 animate-pulse border-2 border-gray-300 transform scale-90 opacity-60"></div>
        <div className="w-[120px] md:w-[160px] aspect-[3/4] bg-gray-300 animate-pulse border-2 border-gray-400 z-10 shadow-lg"></div>
        <div className="w-[120px] md:w-[160px] aspect-[3/4] bg-gray-200 animate-pulse border-2 border-gray-300 transform scale-90 opacity-60"></div>
        <div className="w-[120px] md:w-[160px] aspect-[3/4] bg-gray-200 animate-pulse border-2 border-gray-300 transform scale-90 opacity-60 hidden md:block"></div>
        <div className="w-[120px] md:w-[160px] aspect-[3/4] bg-gray-200 animate-pulse border-2 border-gray-300 transform scale-90 opacity-60 hidden md:block"></div>
      </div>
    </div>
  );
}



export default function Home() {
  return (
    <div className="w-full flex-grow flex flex-col bg-[#f4f4f4] font-sans text-gray-900 selection:bg-amber-500 selection:text-white">
      
      <Suspense fallback={<HeroSkeleton />}>
        <HeroServer />
      </Suspense>

      {/* Pastikan tidak ada mb-12 atau margin bawah yang besar di sini */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-10 flex flex-col lg:grid lg:grid-cols-12 gap-10">
        <div className="w-full lg:col-span-8 flex flex-col gap-12">
          <Suspense fallback={<ComicSkeleton />}>
            <PopularComics />
          </Suspense>

          <Suspense fallback={<NewsFeedSkeleton />}>
            <NewsFeed />
          </Suspense>
        </div>

        <div className="w-full lg:col-span-4">
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar />
          </Suspense>
        </div>
      </main>

      <Suspense fallback={<SliderSkeleton />}>
        <FeaturedServer />
      </Suspense>

    </div>
  );
}