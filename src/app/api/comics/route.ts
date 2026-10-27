import { NextRequest, NextResponse } from "next/server";
import { getMangaByCategory, getMangaBySearch } from "@/lib/mangadex";
import { getKomikuPopularManga, searchKomiku } from "@/lib/komiku";
import { getAnilistPopularManga, getAnilistMangaBySearch } from "@/lib/anilist";

// ISR 5 menit — jangan force-dynamic
export const revalidate = 300;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

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

function filterCategory(data: any[], category: string) {
  if (category === "Semua") return data;
  return data.filter((c) => {
    const t = (c.type || "Manga").toLowerCase();
    if (category === "Manhwa" && (t.includes("manhwa") || t.includes("korea") || t.includes("kr") || t.includes("webtoon"))) return true;
    if (category === "Manhua" && (t.includes("manhua") || t.includes("china") || t.includes("cn"))) return true;
    if (category === "Manga" && !t.includes("manhwa") && !t.includes("manhua") && !t.includes("korea") && !t.includes("china")) return true;
    return false;
  });
}

function mapAniList(raw: any[]) {
  return (raw || []).map((c: any) => {
    let type = "Manga";
    if (c.countryOfOrigin === "KR") type = "Manhwa";
    else if (c.countryOfOrigin === "CN" || c.countryOfOrigin === "TW") type = "Manhua";
    
    return {
      id: `anilist:${c.id}`,
      title: c.title,
      type,
      // PERBAIKAN: Gunakan c.img (untuk katalog) ATAU c.coverImage (untuk search)
      img: c.img || c.coverImage || "https://placehold.co/400x600/png?text=No+Image",
      rating: c.averageScore || 0,
      popularity: c.popularity || 0,
      readers: c.popularity ? c.popularity.toLocaleString() : "AniList",
      chapters: c.chapters ? String(c.chapters) : "?",
      source: "anilist",
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const category = searchParams.get("category") || "Semua";
  const sort = searchParams.get("sort") || "Populer";
  const source = searchParams.get("source") || "Semua";
  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "Semua";

  const t0 = Date.now();

  try {
    // ==========================================
    // SEARCH
    // ==========================================
    if (query) {
      const [mdx, komiku, ani] = await Promise.allSettled([
        getMangaBySearch(query),
        searchKomiku(query),
        getAnilistMangaBySearch(query),
      ]);

      let combined: any[] = [];

      if (source === "Semua" || source === "MangaDex") {
        if (mdx.status === "fulfilled") {
          combined.push(...mdx.value.map((c: any) => ({ ...c, source: "mangadex" })));
        }
      }
      if (source === "Semua" || source === "Komiku") {
        if (komiku.status === "fulfilled") {
          combined.push(...komiku.value.map((c: any) => ({ ...c, source: "komiku" })));
        }
      }
      if (source === "Semua" || source === "AniList") {
        if (ani.status === "fulfilled") combined.push(...mapAniList(ani.value));
      }

      combined = filterCategory(combined, category);
      combined = deduplicate(combined);
      combined = sortData(combined, sort);

      const offset = (page - 1) * limit;
      console.log(`[API/search] ${query} | ${Date.now() - t0}ms`);
      return NextResponse.json(
        { data: combined.slice(offset, offset + limit), total: combined.length },
        { headers: CACHE_HEADERS }
      );
    }

    // ==========================================
    // SUMBER TUNGGAL
    // ==========================================
    if (source === "MangaDex") {
      const result = await getMangaByCategory(category, sort, page, limit, genre);
      console.log(`[API/mangadex] ${category}|${sort}|${genre}|p${page} | ${Date.now() - t0}ms`);
      return NextResponse.json(
        { data: result.data, total: result.total },
        { headers: CACHE_HEADERS }
      );
    }

    if (source === "Komiku") {
      const result = await getKomikuPopularManga(page, limit, category, genre);
      console.log(`[API/komiku] p${page} | ${Date.now() - t0}ms`);
      return NextResponse.json(
        { data: sortData(result.data, sort), total: result.total },
        { headers: CACHE_HEADERS }
      );
    }

    if (source === "AniList") {
      const raw = await getAnilistPopularManga(genre);
      const mapped = mapAniList(raw);
      const filtered = filterCategory(mapped, category);
      const sorted = sortData(filtered, sort);

      const offset = (page - 1) * limit;
      console.log(`[API/anilist] p${page} | ${Date.now() - t0}ms`);
      return NextResponse.json(
        { data: sorted.slice(offset, offset + limit), total: sorted.length },
        { headers: CACHE_HEADERS }
      );
    }

    // ==========================================
    // SEMUA SUMBER (GABUNGAN)
    // ==========================================
    // Ambil window tetap, JANGAN page * limit.
    // Untuk merge + dedupe + sort, cukup ~4x limit.
    const window = Math.min(limit * 4, 120);

    const [mdxS, aniS, komikuS] = await Promise.allSettled([
      getMangaByCategory(category, sort, 1, window, genre),
      getAnilistPopularManga(genre),
      getKomikuPopularManga(1, window, category, genre),
    ]);

    const mdxRes = mdxS.status === "fulfilled" ? mdxS.value : { data: [], total: 0 };
    const aniRes = aniS.status === "fulfilled" ? aniS.value : [];
    const komikuRes = komikuS.status === "fulfilled" ? komikuS.value : { data: [], total: 0 };

    let combined = [
      ...mdxRes.data,
      ...mapAniList(aniRes),
      ...komikuRes.data,
    ];

    combined = filterCategory(combined, category);
    combined = deduplicate(combined);
    combined = sortData(combined, sort);

    const offset = (page - 1) * limit;
    const paginated = combined.slice(offset, offset + limit);

    console.log(
      `[API/all] ${category}|${sort}|${genre}|p${page} | ` +
      `mdx=${mdxRes.data.length} ani=${aniRes.length} kmk=${komikuRes.data.length} | ` +
      `${Date.now() - t0}ms`
    );

    return NextResponse.json(
      {
        data: paginated,
        total: mdxRes.total + aniRes.length + komikuRes.total,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("[API COMICS ERROR]", (error as Error).message);
    return NextResponse.json(
      { data: [], total: 0 },
      { status: 200, headers: CACHE_HEADERS }
    );
  }
}