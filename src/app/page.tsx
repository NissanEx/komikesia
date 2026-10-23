import { Suspense } from "react";
import { connection } from "next/server"; // <-- Tambahan untuk Next.js 16
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ComicGrid from "@/components/ComicGrid";
import NewsFeed from "@/components/NewsFeed";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { getPopularManga } from "@/lib/mangadex";

async function PopularComics() {
  // Memaksa Next.js untuk merender ini secara dinamis (menghilangkan error Date.now)
  await connection(); 
  
  const comics = await getPopularManga();
  return <ComicGrid initialComics={comics} />;
}

function ComicSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 h-64 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      <Hero />
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          <Suspense fallback={<ComicSkeleton />}>
            <PopularComics />
          </Suspense>
          <NewsFeed />
        </div>
        <div className="lg:col-span-4">
          <Sidebar />
        </div>
      </main>
      <Footer />
    </div>
  );
}