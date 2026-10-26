import { NextRequest, NextResponse } from "next/server";
import { getMangaByCategory, getMangaBySearch } from "@/lib/mangadex";
import { getKomikuPopularManga, searchKomiku } from "@/lib/komiku";
import { getAnilistPopularManga, getAnilistMangaBySearch } from "@/lib/anilist";

export const dynamic = 'force-dynamic';

function sortData(data: any[], sort: string) {
  const sorted = [...data];
  if (sort === "Rating") {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === "A-Z") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }
  return sorted;
}

function deduplicate(data: any[]) {
  const seen = new Set();
  return data.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const category = searchParams.get("category") || "Semua";
  const sort = searchParams.get("sort") || "Populer";
  const source = searchParams.get("source") || "Semua";
  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "Semua";

  const noCacheHeaders = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' };

  try {
    if (query) {
      // ... (Logika Search tetap sama)
      const searchResults = await Promise.allSettled([
        getMangaBySearch(query),
        searchKomiku(query),
        getAnilistMangaBySearch(query)
      ]);

      let combined: any[] = [];

      if (source === "Semua" || source === "MangaDex") {
        combined.push(...(searchResults[0].status === "fulfilled" ? searchResults[0].value : []).map((c: any) => ({ ...c, source: "mangadex" })));
      }
      if (source === "Semua" || source === "Komiku") {
        combined.push(...(searchResults[1].status === "fulfilled" ? searchResults[1].value : []).map((c: any) => ({ ...c, source: "komiku" })));
      }
      if (source === "Semua" || source === "AniList") {
        const aniRaw = searchResults[2].status === "fulfilled" ? searchResults[2].value : [];
        const aniData = aniRaw.map((c: any) => {
          let type = "Manga";
          if (c.countryOfOrigin === "KR") type = "Manhwa";
          else if (c.countryOfOrigin === "CN" || c.countryOfOrigin === "TW") type = "Manhua";
          return {
            id: `anilist:${c.id}`,
            title: c.title,
            type: type,
            img: c.coverImage,
            rating: c.averageScore || 0,
            popularity: c.popularity || 0,
            readers: c.popularity ? c.popularity.toLocaleString() : "AniList", 
            chapters: c.chapters ? String(c.chapters) : "?",
            source: "anilist"
          };
        });
        combined.push(...aniData);
      }

      if (category !== "Semua") {
        combined = combined.filter((c) => {
          const t = (c.type || "Manga").toLowerCase();
          if (category === "Manhwa" && (t.includes("manhwa") || t.includes("korea") || t.includes("kr") || t.includes("webtoon"))) return true;
          if (category === "Manhua" && (t.includes("manhua") || t.includes("china") || t.includes("cn"))) return true;
          if (category === "Manga" && !t.includes("manhwa") && !t.includes("manhua") && !t.includes("korea") && !t.includes("china")) return true;
          return false;
        });
      }

      combined = deduplicate(combined);
      combined = sortData(combined, sort);

      const offset = (page - 1) * limit;
      return NextResponse.json({
        data: combined.slice(offset, offset + limit),
        total: combined.length
      }, { headers: noCacheHeaders });
    }

    // ==========================================
    // LOGIKA SUMBER TUNGGAL (PENTING UNTUK MANGADEX)
    // ==========================================
    if (source === "MangaDex") {
      const result = await getMangaByCategory(category, sort, page, limit, genre);
      return NextResponse.json({ data: result.data, total: result.total }, { headers: noCacheHeaders });
    }

    if (source === "Komiku") {
      const result = await getKomikuPopularManga(page, limit, category, genre);
      return NextResponse.json({ data: sortData(result.data, sort), total: result.total }, { headers: noCacheHeaders });
    }

    if (source === "AniList") {
      const raw = await getAnilistPopularManga(genre);
      let mappedAni = raw.map((c: any) => ({
        ...c,
        rating: c.averageScore || 0,
        popularity: c.popularity || 0,
        readers: c.popularity ? c.popularity.toLocaleString() : "AniList"
      }));

      const filtered = category === "Semua" ? mappedAni : mappedAni.filter((c: any) => c.type === category);
      const sorted = sortData(filtered, sort);
      
      const offset = (page - 1) * limit;
      return NextResponse.json({ data: sorted.slice(offset, offset + limit), total: sorted.length }, { headers: noCacheHeaders });
    }

    // ==========================================
    // SEMUA SUMBER (GABUNGAN)
    // ==========================================
    const fetchLimit = Math.min(page * limit + 20, 2000); 
    
    const results = await Promise.allSettled([
      getMangaByCategory(category, sort, 1, fetchLimit, genre), 
      getAnilistPopularManga(genre),
      getKomikuPopularManga(1, fetchLimit, category, genre) 
    ]);

    const mdxRes = results[0].status === "fulfilled" ? results[0].value : { data: [], total: 0 };
    const aniRes = results[1].status === "fulfilled" ? results[1].value : [];
    const komikuRes = results[2].status === "fulfilled" ? results[2].value : { data: [], total: 0 };

    const aniMapped = aniRes.map((c: any) => ({
      ...c,
      rating: c.averageScore || 0,
      popularity: c.popularity || 0,
      readers: c.popularity ? c.popularity.toLocaleString() : "AniList"
    }));

    let combinedRaw = [
      ...mdxRes.data,
      ...aniMapped,
      ...komikuRes.data
    ];

    if (category !== "Semua") {
      combinedRaw = combinedRaw.filter((c) => {
        const t = (c.type || "Manga").toLowerCase();
        if (category === "Manhwa" && (t.includes("manhwa") || t.includes("korea") || t.includes("kr") || t.includes("webtoon"))) return true;
        if (category === "Manhua" && (t.includes("manhua") || t.includes("china") || t.includes("cn"))) return true;
        if (category === "Manga" && !t.includes("manhwa") && !t.includes("manhua") && !t.includes("korea") && !t.includes("china")) return true;
        return false;
      });
    }

    let combinedClean = deduplicate(combinedRaw);
    let combinedSorted = sortData(combinedClean, sort);

    const offset = (page - 1) * limit;
    const paginatedData = combinedSorted.slice(offset, offset + limit);

    return NextResponse.json({ 
      data: paginatedData, 
      total: mdxRes.total + aniRes.length + komikuRes.total 
    }, { headers: noCacheHeaders });

  } catch (error) {
    console.error("[API COMICS ERROR]", error);
    return NextResponse.json({ data: [], total: 0 }, { status: 200, headers: noCacheHeaders }); 
  }
}