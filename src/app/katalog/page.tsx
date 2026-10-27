import { Suspense } from "react";
import { connection } from "next/server";
import ComicGrid from "@/components/ComicGrid";
import { getPopularManga } from "@/lib/mangadex";
// HAPUS: import Header from "@/components/Header";
// HAPUS: import Footer from "@/components/Footer";

async function CatalogContent() {
  await connection(); 
  const mangadexRes = await getPopularManga();
  return <ComicGrid initialComics={mangadexRes.data} total={mangadexRes.total} />;
}

function CatalogSkeleton() {
  return (
    <div className="animate-pulse w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex flex-col">
            <div className="bg-gray-200 aspect-[3/4] border-2 border-gray-300 mb-3"></div>
            <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <div className="w-full flex-grow">
      
      <main className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Katalog
          </h1>
        </div>
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent />
        </Suspense>
      </main>
      
      {/* HAPUS: <Footer /> */}
    </div>
  );
}