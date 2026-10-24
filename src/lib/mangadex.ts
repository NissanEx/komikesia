const BASE = "https://api.mangadex.org";

export interface ComicCard {
  id: string;
  title: string;
  type: string;
  img: string;
  rating: number;
  readers: string;
  chapters: string;
  source: "mangadex";
}

const lastGood = new Map<string, string>();

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { next?: { revalidate?: number } } = {},
  timeoutMs = 8000
): Promise<Response> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    res.clone().text().then((t) => {
      if (lastGood.size > 200) lastGood.delete(lastGood.keys().next().value!);
      lastGood.set(url, t);
    }).catch(() => {});

    return res;
  } catch (err) {
    const stale = lastGood.get(url);
    if (stale) {
      return new Response(stale, { status: 200, headers: { "content-type": "application/json" } });
    }
    throw err;
  }
}

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[LOKAL] Gagal ${label}:`, (error as Error).message);
    return fallback;
  }
}

// ============================================
// HELPERS
// ============================================
export function pickTitle(manga: any): string {
  const t = manga?.attributes?.title || {};
  const alt = (manga?.attributes?.altTitles || []).find((a: any) => a.en)?.en;
  return (t.en || t["ja-ro"] || t["ko-ro"] || t["zh-ro"] || alt || Object.values(t)[0] || "Judul Tidak Diketahui") as string;
}

export function detectType(originalLanguage?: string): string {
  if (!originalLanguage) return "Manga";
  const lang = originalLanguage.toLowerCase();
  if (lang.startsWith("ko")) return "Manhwa";
  if (lang.startsWith("zh")) return "Manhua";
  return "Manga";
}

export const coverUrl = (mangaId: string, manga: any) => {
  const f = manga?.relationships?.find((r: any) => r.type === "cover_art")?.attributes?.fileName;
  return f ? `https://uploads.mangadex.org/covers/${mangaId}/${f}.256.jpg` : "https://via.placeholder.com/400x600?text=No+Image";
};

function formatCount(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ============================================
// 1. Detail & Chapter
// ============================================
async function fetchMangaCached(id: string) {
  const targetUrl = `${BASE}/manga/${id}?includes[]=cover_art&includes[]=author`;
  const response = await fetchWithTimeout(targetUrl, { next: { revalidate: 3600 } });
  return await response.json();
}

export async function getMangaById(id: string) {
  return safe(() => fetchMangaCached(id), null, `ambil manga ${id}`);
}

const CHAPTER_RATINGS = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";

async function fetchChaptersCached(id: string) {
  const fetchFeed = async (langs: string[], limit: number) => {
    const langQuery = langs.map((l) => `translatedLanguage[]=${l}`).join("&");
    const url = `${BASE}/manga/${id}/feed?${langQuery}${langs.length ? "&" : ""}order[chapter]=desc&limit=${limit}&${CHAPTER_RATINGS}`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 600 } });
    return ((await res.json()).data ?? []) as any[];
  };

  let all = await fetchFeed(["id", "en"], 500);
  if (all.length === 0) all = await fetchFeed([], 100);

  const languages: Record<string, number> = {};
  for (const c of all) {
    const l = c.attributes.translatedLanguage as string;
    languages[l] = (languages[l] ?? 0) + 1;
  }
  return { data: all, languages };
}

export async function getMangaChapters(id: string) {
  return safe(() => fetchChaptersCached(id), { data: [], languages: {} }, `ambil chapter ${id}`);
}

// ============================================
// 2. Komik Populer
// ============================================
async function fetchPopularByLang(langs: string[], limit: number) {
  const langQuery = langs.map((l) => `originalLanguage[]=${l}`).join("&");
  const url = `${BASE}/manga?limit=${limit}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&${langQuery}`;
  const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
  const json = await res.json();
  return { data: json.data as any[], total: json.total as number };
}

// FUNGSI YANG HILANG SUDAH DITAMBAHKAN DI SINI
async function fetchLatestChapterNumber(id: string) {
  try {
    const res = await fetchWithTimeout(`${BASE}/manga/${id}/aggregate`, { next: { revalidate: 86400 } });
    const json = await res.json();
    let max = 0;
    for (const vol of Object.values(json.volumes ?? {}) as any[]) {
      for (const ch of Object.values(vol.chapters ?? {}) as any[]) {
        const n = parseFloat(ch?.chapter);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return max ? String(max) : null;
  } catch (error) {
    return null;
  }
}

async function fetchPopularCached(): Promise<{ data: ComicCard[], total: number }> {
  try {
    const results = await Promise.allSettled([
      fetchPopularByLang(["ja"], 40),
      fetchPopularByLang(["ko"], 40),
      fetchPopularByLang(["zh", "zh-hk"], 40),
    ]);

    let list: any[] = [];
    let totalCount = 0;

    results.forEach((r) => {
      if (r.status === "fulfilled") {
        list.push(...r.value.data);
        totalCount += r.value.total;
      }
    });

    list = Array.from(new Map(list.map((m) => [m.id, m])).values());
    if (list.length === 0) return { data: [], total: 0 };

    let stats: Record<string, any> = {};
    for (let i = 0; i < list.length; i += 20) {
      const batch = list.slice(i, i + 20);
      try {
        const ids = batch.map((m) => `manga[]=${m.id}`).join("&");
        const sres = await fetchWithTimeout(`${BASE}/statistics/manga?${ids}`);
        if (sres.ok) {
          const sdata = (await sres.json()).statistics ?? {};
          stats = { ...stats, ...sdata };
        }
      } catch (e) {}
    }

    const latest: Record<string, string | null> = {};
    const missing = list.filter((m) => !m.attributes.lastChapter);
    for (let i = 0; i < missing.length; i += 6) {
      const batch = missing.slice(i, i + 6);
      const settled = await Promise.allSettled(batch.map((m) => fetchLatestChapterNumber(m.id)));
      settled.forEach((r, idx) => {
        latest[batch[idx].id] = r.status === "fulfilled" ? r.value : null;
      });
    }

    const data = list.map((manga: any) => {
      const s = stats[manga.id];
      return {
        id: manga.id,
        title: pickTitle(manga),
        type: detectType(manga.attributes.originalLanguage),
        img: coverUrl(manga.id, manga),
        rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian / 2) : 0,
        readers: formatCount(s?.follows ?? 0),
        chapters: manga.attributes.lastChapter || latest[manga.id] || "?",
        source: "mangadex" as const,
      };
    });

    return { data, total: totalCount };
  } catch (error) {
    return { data: [], total: 0 };
  }
}

export async function getPopularManga() {
  return safe(fetchPopularCached, { data: [], total: 0 }, "mengambil data populer");
}

export async function getMangaByCategory(
  category: string = "Semua",
  sort: string = "Populer",
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  
  let langQuery = "";
  if (category === "Manga") langQuery = "originalLanguage[]=ja";
  else if (category === "Manhwa") langQuery = "originalLanguage[]=ko";
  else if (category === "Manhua") langQuery = "originalLanguage[]=zh&originalLanguage[]=zh-hk";

  let orderQuery = "order[followedCount]=desc";
  if (sort === "A-Z") orderQuery = "order[title]=asc";
  else if (sort === "Rating") orderQuery = "order[rating]=desc";

  const url = `${BASE}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&${orderQuery}&contentRating[]=safe&contentRating[]=suggestive&${langQuery}`;
  
  try {
    const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    const list = json.data || [];
    
    // AMBIL STATISTIK (FOLLOWERS & RATING)
    let stats: Record<string, any> = {};
    try {
      const ids = list.map((m: any) => `manga[]=${m.id}`).join("&");
      const sres = await fetchWithTimeout(`${BASE}/statistics/manga?${ids}`);
      if (sres.ok) stats = (await sres.json()).statistics ?? {};
    } catch {}

    // FORMAT DATA
    const formattedData = list.map((manga: any) => {
      const s = stats[manga.id];
      return {
        id: manga.id,
        title: pickTitle(manga),
        type: detectType(manga.attributes.originalLanguage),
        img: coverUrl(manga.id, manga),
        rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian / 2) : 0,
        readers: formatCount(s?.follows ?? 0),
        chapters: manga.attributes.lastChapter || "?",
        source: "mangadex" as const
      };
    });

    return { data: formattedData, total: json.total || 0 };
  } catch (e) {
    return { data: [], total: 0 };
  }
}
// ============================================
// 4. Pencarian, Gambar, Chapter Terbaru, dll
// ============================================
async function fetchSearchCached(query: string): Promise<ComicCard[]> {
  const url = `${BASE}/manga?title=${encodeURIComponent(query)}&limit=24&includes[]=cover_art&order[relevance]=desc&${CHAPTER_RATINGS}`;
  const res = await fetchWithTimeout(url, { next: { revalidate: 600 } });
  const data = (await res.json()).data ?? [];
  if (data.length === 0) return [];

  let stats: Record<string, any> = {};
  try {
    const ids = data.map((m: any) => `manga[]=${m.id}`).join("&");
    const sres = await fetchWithTimeout(`${BASE}/statistics/manga?${ids}`);
    if (sres.ok) stats = (await sres.json()).statistics ?? {};
  } catch {}

  return data.map((manga: any) => {
    const s = stats[manga.id];
    return {
      id: manga.id, title: pickTitle(manga), type: detectType(manga.attributes.originalLanguage),
      img: coverUrl(manga.id, manga),
      rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian / 2) : 0,
      readers: formatCount(s?.follows ?? 0),
      chapters: manga.attributes.lastChapter || "?", source: "mangadex" as const,
    };
  });
}

export async function getMangaBySearch(query: string): Promise<ComicCard[]> {
  if (!query || query.trim() === "") return [];
  return safe(() => fetchSearchCached(query), [], `mencari komik "${query}"`);
}

export async function getChapterImages(chapterId: string) {
  try {
    const chRes = await fetchWithTimeout(`${BASE}/chapter/${chapterId}`);
    const chData = await chRes.json();
    const chapterNumber = chData.data?.attributes?.chapter || "?";

    if (chData.data?.attributes?.externalUrl) {
      return { images: [], externalUrl: chData.data.attributes.externalUrl as string, chapterNumber };
    }
    const response = await fetchWithTimeout(`${BASE}/at-home/server/${chapterId}`);
    const data = await response.json();
    const { baseUrl, chapter } = data;
    const { hash, data: pageFiles } = chapter;
    const images = pageFiles.map((filename: string) => `${baseUrl}/data/${hash}/${filename}`);

    return { images: images as string[], externalUrl: null, chapterNumber };
  } catch (error) {
    return { images: [], externalUrl: null, chapterNumber: "?" };
  }
}

async function fetchRecentChaptersCached(limit: number) {
  const res = await fetchWithTimeout(`${BASE}/chapter?limit=${limit * 2}&order[readableAt]=desc&contentRating[]=safe&contentRating[]=suggestive`);
  const chapters = (await res.json()).data as any[];
  const seen = new Set<string>();
  const picked = chapters.filter((c) => {
      const mid = c.relationships.find((r: any) => r.type === "manga")?.id;
      if (!mid || seen.has(mid)) return false;
      seen.add(mid); return true;
    }).slice(0, limit);

  if (picked.length === 0) return [];
  const ids = picked.map((c) => `ids[]=${c.relationships.find((r: any) => r.type === "manga").id}`);
  const mangaMap: Record<string, any> = {};
  try {
    const mres = await fetchWithTimeout(`${BASE}/manga?${ids.join("&")}&limit=${limit}&includes[]=cover_art`);
    if (mres.ok) for (const m of (await mres.json()).data) mangaMap[m.id] = m;
  } catch {}

  return picked.map((c) => {
    const mid = c.relationships.find((r: any) => r.type === "manga").id;
    const manga = mangaMap[mid] ?? c.relationships.find((r: any) => r.type === "manga");
    return {
      chapterId: c.id, mangaId: mid, title: pickTitle(manga),
      chapter: `Chapter ${c.attributes.chapter ?? "?"}`,
      time: timeAgo(c.attributes.readableAt ?? c.attributes.publishAt),
      img: coverUrl(mid, mangaMap[mid]),
    };
  });
}

export async function getRecentChapters(limit = 6) {
  return safe(() => fetchRecentChaptersCached(limit), [], "ambil chapter terbaru");
}

async function fetchComicOfTheWeekCached() {
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 19);
  const res = await fetchWithTimeout(`${BASE}/manga?limit=1&order[followedCount]=desc&hasAvailableChapters=true&updatedAtSince=${since}&includes[]=cover_art&includes[]=author&contentRating[]=safe&contentRating[]=suggestive`);
  const manga = (await res.json()).data?.[0];
  if (!manga) return null;

  let stat: any = null;
  try {
    const sres = await fetchWithTimeout(`${BASE}/statistics/manga/${manga.id}`);
    if (sres.ok) stat = (await sres.json()).statistics?.[manga.id];
  } catch {}

  const status = manga.attributes.status as string;
  return {
    id: manga.id, title: pickTitle(manga), img: coverUrl(manga.id, manga),
    genres: manga.attributes.tags.filter((t: any) => t.attributes.group === "genre").slice(0, 2).map((t: any) => t.attributes.name.en).join(", "),
    status: status.charAt(0).toUpperCase() + status.slice(1),
    author: manga.relationships.find((r: any) => r.type === "author")?.attributes?.name ?? "-",
    rating: stat?.rating?.bayesian ? Math.round(stat.rating.bayesian / 2) : 0,
    followers: formatCount(stat?.follows ?? 0),
  };
}

export async function getComicOfTheWeek() {
  return safe(fetchComicOfTheWeekCached, null, "ambil komik minggu ini");
}

export async function getTopRatedManga(limit = 3) {
  try {
    const url = `${BASE}/manga?limit=${limit}&includes[]=cover_art&order[rating]=desc&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
    const list = (await res.json()).data as any[];
    
    if (list.length === 0) return [];

    let stats: Record<string, any> = {};
    try {
      const ids = list.map((m) => `manga[]=${m.id}`).join("&");
      const sres = await fetchWithTimeout(`${BASE}/statistics/manga?${ids}`);
      if (sres.ok) stats = (await sres.json()).statistics ?? {};
    } catch {}

    return list.map((manga: any) => {
      const s = stats[manga.id];
      return {
        id: manga.id,
        title: pickTitle(manga),
        img: coverUrl(manga.id, manga),
        rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian / 2) : 0,
        followers: formatCount(s?.follows ?? 0),
        chapters: manga.attributes.lastChapter || "?",
        type: detectType(manga.attributes.originalLanguage),
      };
    });
  } catch (error) {
    return [];
  }
}

export function getTitleCandidates(manga: any): string[] {
  const t = manga.attributes.title || {};
  const altEn = (manga.attributes.altTitles || []).map((a: any) => a.en).filter(Boolean);
  const candidates = [t.en, ...altEn, t["ja-ro"], t["ko-ro"], t["zh-ro"], ...(Object.values(t) as string[])].filter(Boolean) as string[];
  return [...new Set(candidates)].slice(0, 4);
}