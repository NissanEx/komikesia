"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, ExternalLink } from "lucide-react";

export default function ChapterList({ 
  chapters, 
  mangaId, 
  languages 
}: { 
  chapters: any[]; 
  mangaId: string; 
  languages: Record<string, number>; 
}) {
  const availableLangs = Object.keys(languages);
  
  const getDefaultLang = () => {
    if (languages["id"] && languages["id"] > 0) return "id";
    if (languages["en"] && languages["en"] > 0) return "en";
    return availableLangs[0] || "en";
  };

  const [selectedLang, setSelectedLang] = useState(getDefaultLang());

  useEffect(() => {
    setSelectedLang(getDefaultLang());
  }, [chapters, languages]);

  const filteredChapters = useMemo(() => {
    const langChapters = chapters.filter((c) => c.attributes.translatedLanguage === selectedLang);
    const seen = new Set();
    const unique = [];
    for (const c of langChapters) {
      const key = c.attributes.chapter || c.id;
      if (!seen.has(key)) { 
        seen.add(key); 
        unique.push(c); 
      }
    }
    return unique;
  }, [chapters, selectedLang]);

  // Cek apakah ID ini berasal dari AniList
  const isAnilist = mangaId.startsWith("anilist:");
  const anilistUrl = isAnilist ? `https://anilist.co/manga/${mangaId.replace("anilist:", "")}` : "";

  // AMANKAN ID MANGA: Ubah "/" menjadi "%2F" dan ":" menjadi "%3A"
  const safeMangaId = encodeURIComponent(mangaId);

  return (
    <div className="bg-white border-2 border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] mt-8">
      
      {/* HEADER INDEKS CHAPTER */}
      <div className="p-6 border-b-2 border-gray-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
        <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" /> Indeks Chapter
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          
          {isAnilist && (
            <a 
              href={anilistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-blue-100 text-blue-800 border-2 border-blue-800 px-3 py-1.5 font-bold uppercase tracking-widest hover:bg-blue-800 hover:text-white transition-colors"
              title="Buka di AniList"
            >
              <ExternalLink className="w-3.5 h-3.5" /> AniList
            </a>
          )}

          <span className="text-gray-500 font-bold uppercase tracking-widest">Filter Bahasa:</span>
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value)} 
            className="bg-white border-2 border-gray-900 px-3 py-1.5 font-bold uppercase tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {availableLangs.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()} [{languages[lang]}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DAFTAR CHAPTER */}
      <div className="divide-y-2 divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
        {filteredChapters.length > 0 ? (
          filteredChapters.map((chapter: any) => {
            const isAlternative = !!chapter.attributes.nyoraSource;
            
            const safeChapterId = isAlternative 
              ? encodeURIComponent(btoa(chapter.id))
              : chapter.id;
            
            // MENGGUNAKAN safeMangaId DI SINI
            const href = isAlternative 
              ? `/comic/${safeMangaId}/chapter/${safeChapterId}?source=${chapter.attributes.nyoraSource}&mangaUrl=${encodeURIComponent(chapter.attributes.nyoraMangaUrl)}`
              : `/comic/${safeMangaId}/chapter/${safeChapterId}`;

            return (
              <div key={chapter.id} className="p-4 hover:bg-amber-50 transition-colors flex justify-between items-center group">
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    Ch. {chapter.attributes.chapter || "?"}
                    {chapter.attributes.title && (
                      <span className="font-serif italic text-gray-600 text-base ml-2">
                        — {chapter.attributes.title}
                      </span>
                    )}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                    <span>
                      {chapter.attributes.publishAt 
                        ? new Date(chapter.attributes.publishAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) 
                        : "TANPA TANGGAL"}
                    </span>
                    {isAlternative && (
                      <span className="bg-gray-900 text-white px-2 py-0.5 rounded-none">
                        {chapter.attributes.sourceName || "ALT"}
                      </span>
                    )}
                  </div>
                </div>

                <Link 
                  href={href} 
                  className="bg-white border-2 border-gray-900 text-gray-900 font-mono text-xs font-bold uppercase tracking-widest px-4 py-2 flex items-center gap-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] group-hover:bg-gray-900 group-hover:text-white group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
                >
                  Baca <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-gray-500 font-mono text-sm uppercase tracking-widest bg-white">
            Belum ada chapter untuk bahasa ini.
          </div>
        )}
      </div>
    </div>
  );
}