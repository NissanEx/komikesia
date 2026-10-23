"use client";

import { useState } from "react";
import { Star, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ComicGrid({ initialComics }: { initialComics: any[] }) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const categories = ["Semua", "Manga", "Manhwa", "Manhua"];

  // Filter data berdasarkan state
  const filteredComics = activeCategory === "Semua" 
    ? initialComics 
    : initialComics.filter((comic) => comic.type === activeCategory);

  return (
    <div>
      {/* TABS KATEGORI */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 text-sm font-semibold">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`pb-2 transition-colors ${
              activeCategory === category
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* GRID KOMIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredComics.length > 0 ? (
          filteredComics.map((comic) => (
            <Link href={`/comic/${comic.id}`} key={comic.id}>
              <div className="bg-white rounded shadow-sm overflow-hidden group cursor-pointer border border-gray-100 hover:border-gray-300 transition h-full flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img 
                    src={comic.img} 
                    alt={comic.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                  <div className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    {comic.type}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm truncate text-gray-800 mb-1" title={comic.title}>
                      {comic.title}
                    </h3>
                    <div className="flex text-gray-800 text-xs mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < comic.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex border-t border-gray-100 pt-2 text-center text-xs">
                    <div className="flex-1 border-r border-gray-100 flex flex-col items-center justify-center">
                      <BookOpen className="w-3 h-3 text-gray-400 mb-1" />
                      <span className="font-bold block text-gray-900">{comic.chapters}</span>
                      <span className="text-gray-400">Chapters</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <span className="font-bold block text-gray-900">{comic.readers}</span>
                      <span className="text-gray-400">Followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-gray-500">
            Belum ada komik dengan kategori <strong>{activeCategory}</strong> (atau koneksi ke API gagal).
          </div>
        )}
      </div>
    </div>
  );
}