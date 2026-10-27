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

const GENRE_TAGS: Record<string, string> = {
  "Action": "391b0423-d847-456f-aff0-8b0cfc03066b",
  "Romance": "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
  "Isekai": "ace04997-f6bd-436e-b261-779182193d3d",
  "Murim": "799c202e-7daa-44eb-9cf7-8a3c0441531e",
  "School Life": "caaa44eb-cd40-4177-b930-79d3ef2afe87",
  "Fantasy": "cdc58593-87dd-415e-bbc0-2ec27bf3405e",
  "Comedy": "4d32cc48-9f00-4cca-9b5a-a839f0764984",
  "Horror": "cdad7e68-1419-41dd-bdce-27753074a640",
  "Mystery": "ee968100-4191-4968-93d3-f82d72be7e46",
};

// ============================================
// CACHE + FETCH
// ============================================
type CacheEntry = { data: any; expires: number };
const CACHE = new Map<string, CacheEntry>();
const STALE = new Map<string, any>();
const MAX_CACHE = 800;

function getCached<T>(key: string): T | null {
  const e = CACHE.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) { CACHE.delete(key); return null; }
  return e.data as T;
}

function setCached(key: string, data: any, ttlMs: number) {
  if (CACHE.size >= MAX_CACHE) {
    const k = CACHE.keys().next().value;
    if (k !== undefined) CACHE.delete(k);
  }
  CACHE.set(key, { data, expires: Date.now() + ttlMs });
  if (STALE.size >= MAX_CACHE) {
    const k = STALE.keys().next().value;
    if (k !== undefined) STALE.delete(k);
  }
  STALE.set(key, data);
}

async function fetchJSON<T = any>(
  url: string,
  ttlMs = 3_600_000,
  timeoutMs = 6000
): Promise<T> {
  const cached = getCached<T>(url);
  if (cached) return cached;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: Math.floor(ttlMs / 1000) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    setCached(url, data, ttlMs);
    return data;
  } catch (err) {
    const stale = STALE.get(url);
    if (stale !== undefined) {
      console.warn(`[MANGADEX] stale fallback: ${(err as Error).message}`);
      return stale as T;
    }
    throw err;
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      try { out[i] = await fn(items[i], i); }
      catch { out[i] = undefined as any; }
    }
  });
  await Promise.all(workers);
  return out;
}

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await fn(); }
  catch (e) { console.error(`[LOKAL] Gagal ${label}:`, (e as Error).message); return fallback; }
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
  return f
    ? `https://uploads.mangadex.org/covers/${mangaId}/${f}.256.jpg`
    : "https://via.placeholder.com/400x600?text=No+Image";
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

function toCard(manga: any, stats: Record<string, any>, extraChapters?: string | null): ComicCard {
  const s = stats[manga.id];
  return {
    id: manga.id,
    title: pickTitle(manga),
    type: detectType(manga.attributes.originalLanguage),
    img: coverUrl(manga.id, manga),
    rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian / 2) : 0,
    readers: formatCount(s?.follows ?? 0),
    chapters: manga.attributes.lastChapter || extraChapters || "?",
    source: "mangadex",
  };
}

// ============================================
// STATISTICS — 1 batch 100 id, parallel, cached 1 jam
// ============================================
async function fetchStatistics(ids: string[]): Promise<Record<string, any>> {
  if (ids.length === 0) return {};
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) batches.push(ids.slice(i, i + 100));

  const results = await Promise.all(
    batches.map((b) => {
      const q = b.map((id) => `manga[]=${id}`).join("&");
      return fetchJSON(`${BASE}/statistics/manga?${q}`, 3_600_000).catch(() => null);
    })
  );

  const merged: Record<string, any> = {};
  for (const r of results) if (r?.statistics) Object.assign(merged, r.statistics);
  return merged;
}

// ============================================
// DETAIL & CHAPTER
// ============================================
export async function getMangaById(id: string) {
  return safe(
    () => fetchJSON(`${BASE}/manga/${id}?includes[]=cover_art&includes[]=author`, 3_600_000),
    null,
    `ambil manga ${id}`
  );
}

const CHAPTER_RATINGS = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";

export async function getMangaChapters(id: string) {
  return safe(async () => {
    const fetchFeed = (langs: string[], limit: number) => {
      const langQuery = langs.map((l) => `translatedLanguage[]=${l}`).join("&");
      const url = `${BASE}/manga/${id}/feed?${langQuery}${langs.length ? "&" : ""}order[chapter]=desc&limit=${limit}&${CHAPTER_RATINGS}`;
      return fetchJSON(url, 600_000);
    };

    let all = ((await fetchFeed(["id", "en"], 500)).data ?? []) as any[];
    if (all.length === 0) all = ((await fetchFeed([], 100)).data ?? []) as any[];

    const languages: Record<string, number> = {};
    for (const c of all) {
      const l = c.attributes.translatedLanguage as string;
      languages[l] = (languages[l] ?? 0) + 1;
    }
    return { data: all, languages };
  }, { data: [], languages: {} }, `ambil chapter ${id}`);
}

// ============================================
// POPULER
// ============================================
async function fetchPopularByLang(langs: string[], limit: number) {
  const langQuery = langs.map((l) => `originalLanguage[]=${l}`).join("&");
  const url = `${BASE}/manga?limit=${limit}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&${langQuery}`;
  const json = await fetchJSON(url, 3_600_000);
  return { data: (json.data as any[]) ?? [], total: (json.total as number) ?? 0 };
}

async function fetchLatestChapterNumber(id: string): Promise<string | null> {
  try {
    const json = await fetchJSON(`${BASE}/manga/${id}/aggregate`, 86_400_000, 5000);
    let max = 0;
    for (const vol of Object.values(json.volumes ?? {}) as any[]) {
      for (const ch of Object.values(vol.chapters ?? {}) as any[]) {
        const n = parseFloat(ch?.chapter);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return max ? String(max) : null;
  } catch { return null; }
}

async function fetchPopularCached(): Promise<{ data: ComicCard[]; total: number }> {
  try {
    const [ja, ko, zh] = await Promise.all([
      fetchPopularByLang(["ja"], 40).catch(() => ({ data: [], total: 0 })),
      fetchPopularByLang(["ko"], 40).catch(() => ({ data: [], total: 0 })),
      fetchPopularByLang(["zh", "zh-hk"], 40).catch(() => ({ data: [], total: 0 })),
    ]);

    let list = [...ja.data, ...ko.data, ...zh.data];
    const totalCount = ja.total + ko.total + zh.total;
    list = Array.from(new Map(list.map((m) => [m.id, m])).values());
    if (list.length === 0) return { data: [], total: 0 };

    // 1 batch parallel (bukan sequential loop)
    const stats = await fetchStatistics(list.map((m) => m.id));

    // aggregate: concurrency 4, bukan batch sequential
    const missing = list.filter((m) => !m.attributes.lastChapter);
    const latest: Record<string, string | null> = {};
    if (missing.length > 0) {
      const results = await mapLimit(missing, 4, (m) => fetchLatestChapterNumber(m.id));
      missing.forEach((m, i) => { latest[m.id] = results[i]; });
    }

    const data = list.map((m) => toCard(m, stats, latest[m.id]));
    return { data, total: totalCount };
  } catch {
    return { data: [], total: 0 };
  }
}

export async function getPopularManga() {
  return safe(fetchPopularCached, { data: [], total: 0 }, "mengambil data populer");
}

// ============================================
// KATEGORI (dipakai /api/comics)
// ============================================
export async function getMangaByCategory(
  category = "Semua",
  sort = "Populer",
  page = 1,
  limit = 20,
  genre = "Semua"
) {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  params.append("includes[]", "cover_art");

  if (sort === "A-Z") params.append("order[title]", "asc");
  else if (sort === "Rating") params.append("order[rating]", "desc");
  else params.append("order[followedCount]", "desc");

  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");

  if (category === "Manga") params.append("originalLanguage[]", "ja");
  else if (category === "Manhwa") params.append("originalLanguage[]", "ko");
  else if (category === "Manhua") {
    params.append("originalLanguage[]", "zh");
    params.append("originalLanguage[]", "zh-hk");
  }

  if (genre !== "Semua" && GENRE_TAGS[genre]) {
    params.append("includedTags[]", GENRE_TAGS[genre]);
  }

  const url = `${BASE}/manga?${params.toString()}`;

  try {
    const json = await fetchJSON(url, 3_600_000);
    const list = (json.data as any[]) ?? [];

    // cache 1 jam, parallel, bukan sequential
    const stats = await fetchStatistics(list.map((m) => m.id));

    return { data: list.map((m) => toCard(m, stats)), total: (json.total as number) ?? 0 };
  } catch (e) {
    console.error("[MANGADEX] Gagal fetch kategori:", (e as Error).message);
    return { data: [], total: 0 };
  }
}

// ============================================
// SEARCH
// ============================================
async function fetchSearchCached(query: string): Promise<ComicCard[]> {
  const url = `${BASE}/manga?title=${encodeURIComponent(query)}&limit=24&includes[]=cover_art&order[relevance]=desc&${CHAPTER_RATINGS}`;
  const data = ((await fetchJSON(url, 600_000)).data ?? []) as any[];
  if (data.length === 0) return [];

  const stats = await fetchStatistics(data.map((m) => m.id));
  return data.map((m) => toCard(m, stats));
}

export async function getMangaBySearch(query: string): Promise<ComicCard[]> {
  if (!query || query.trim() === "") return [];
  return safe(() => fetchSearchCached(query), [], `mencari komik "${query}"`);
}

// ============================================
// GAMBAR CHAPTER
// ============================================
export async function getChapterImages(chapterId: string) {
  try {
    const chData = await fetchJSON(`${BASE}/chapter/${chapterId}`, 600_000);
    const chapterNumber = chData.data?.attributes?.chapter || "?";

    if (chData.data?.attributes?.externalUrl) {
      return { images: [], externalUrl: chData.data.attributes.externalUrl as string, chapterNumber };
    }
    const data = await fetchJSON(`${BASE}/at-home/server/${chapterId}`, 300_000);
    const { baseUrl, chapter } = data;
    const { hash, data: pageFiles } = chapter;
    const images = (pageFiles as string[]).map((f) => `${baseUrl}/data/${hash}/${f}`);
    return { images, externalUrl: null, chapterNumber };
  } catch {
    return { images: [], externalUrl: null, chapterNumber: "?" };
  }
}

// ============================================
// CHAPTER TERBARU
// ============================================
async function fetchRecentChaptersCached(limit: number) {
  const url = `${BASE}/chapter?limit=${limit * 2}&order[readableAt]=desc&contentRating[]=safe&contentRating[]=suggestive`;
  const chapters = ((await fetchJSON(url, 300_000)).data ?? []) as any[];

  const seen = new Set<string>();
  const picked = chapters.filter((c) => {
    const mid = c.relationships.find((r: any) => r.type === "manga")?.id;
    if (!mid || seen.has(mid)) return false;
    seen.add(mid); return true;
  }).slice(0, limit);

  if (picked.length === 0) return [];

  const ids = picked.map((c) => `ids[]=${c.relationships.find((r: any) => r.type === "manga").id}`).join("&");
  const mangaMap: Record<string, any> = {};
  try {
    const mres = await fetchJSON(`${BASE}/manga?${ids}&limit=${limit}&includes[]=cover_art`, 600_000);
    for (const m of (mres.data ?? [])) mangaMap[m.id] = m;
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

// ============================================
// COMIC OF THE WEEK
// ============================================
async function fetchComicOfTheWeekCached() {
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 19);
  const url = `${BASE}/manga?limit=1&order[followedCount]=desc&hasAvailableChapters=true&updatedAtSince=${since}&includes[]=cover_art&includes[]=author&contentRating[]=safe&contentRating[]=suggestive`;
  const manga = ((await fetchJSON(url, 3_600_000)).data ?? [])[0];
  if (!manga) return null;

  let stat: any = null;
  try {
    stat = (await fetchJSON(`${BASE}/statistics/manga/${manga.id}`, 3_600_000)).statistics?.[manga.id];
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

// ============================================
// TOP RATED
// ============================================
export async function getTopRatedManga(limit = 3) {
  try {
    const url = `${BASE}/manga?limit=${limit}&includes[]=cover_art&order[rating]=desc&contentRating[]=safe&contentRating[]=suggestive`;
    const list = ((await fetchJSON(url, 3_600_000)).data ?? []) as any[];
    if (list.length === 0) return [];

    const stats = await fetchStatistics(list.map((m) => m.id));
    return list.map((m) => {
      const s = stats[m.id];
      return {
        id: m.id, title: pickTitle(m), img: coverUrl(m.id, m),
        rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian / 2) : 0,
        followers: formatCount(s?.follows ?? 0),
        chapters: m.attributes.lastChapter || "?",
        type: detectType(m.attributes.originalLanguage),
      };
    });
  } catch { return []; }
}

export function getTitleCandidates(manga: any): string[] {
  const t = manga.attributes.title || {};
  const altEn = (manga.attributes.altTitles || []).map((a: any) => a.en).filter(Boolean);
  const candidates = [t.en, ...altEn, t["ja-ro"], t["ko-ro"], t["zh-ro"], ...(Object.values(t) as string[])].filter(Boolean) as string[];
  return [...new Set(candidates)].slice(0, 4);
}