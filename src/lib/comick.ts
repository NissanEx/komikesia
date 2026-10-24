const WORKER_PROXY_URL = "https://GANTI_DENGAN_URL_WORKER_ANDA.workers.dev"; // <-- GANTI URL INI
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SOURCES_TO_TRY = ["asurascan", "flamecomics", "comix", "likemanga"];
const REQUEST_TIMEOUT = 8000;
const OVERALL_TIMEOUT = 12000;
const TTL_OK = 1000 * 60 * 60;
const TTL_FAIL = 1000 * 60 * 5;

type ComickResult = {
  sourceId: string;
  title: string;      // Tambahan
  coverUrl: string;   // Tambahan
  mangaUrl: string;
  chapters: {
    id: string;
    chapter: string | null;
    title: string | null;
    publishAt: string | null;
    source: string;
  }[];
} | null;

async function fetchViaProxy(targetUrl: string, options: RequestInit = {}) {
  const proxyUrl = `${WORKER_PROXY_URL}/?url=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(proxyUrl, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const COMICK_API_BASE = "https://comick-source-api.notaspider.dev";

async function trySource(source: string, titles: string[]) {
  for (const title of titles) {
    const searchRes = await fetchViaProxy(`${COMICK_API_BASE}/api/search`, {
      method: "POST",
      body: JSON.stringify({ query: title, source }),
    });

    const comics = searchRes?.data ?? searchRes?.results ?? searchRes;
    if (!Array.isArray(comics) || comics.length === 0) continue;

    const comic = comics[0];
    const comicUrl = comic.url || comic.slug || comic.hid || comic.id;
    if (!comicUrl) continue;

    // Ambil URL Gambar Sampul
    const coverKey = comic.md_covers?.[0]?.b2key || comic.cover;
    const coverUrl = coverKey ? `https://meo.comick.pictures/${coverKey}` : "";

    const chaptersRes = await fetchViaProxy(`${COMICK_API_BASE}/api/chapters`, {
      method: "POST",
      body: JSON.stringify({ url: comicUrl, source }),
    });

    const chapters = chaptersRes?.chapters ?? chaptersRes?.data ?? [];
    if (!Array.isArray(chapters) || chapters.length === 0) continue;

    return {
      sourceId: source,
      title: comic.title || comic.name || title, // Ambil judul
      coverUrl: coverUrl, // Ambil cover
      mangaUrl: comicUrl,
      chapters: chapters.map((ch: any) => ({
        id: ch.url || ch.hid || ch.id || ch.chapterId,
        chapter: ch.chap ? String(ch.chap) : (ch.chapter || (ch.title ? ch.title.replace(/[^0-9.]/g, '') : null)),
        title: ch.title || null,
        publishAt: ch.created_at || ch.publishAt || null,
        source,
      })),
    };
  }
  throw new Error("judul tidak ditemukan");
}

async function run(titles: string[]): Promise<ComickResult> {
  const attempts = SOURCES_TO_TRY.map((source) =>
    trySource(source, titles).catch(() => { throw new Error(`Gagal di ${source}`); })
  );
  const deadline = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("batas waktu total habis")), OVERALL_TIMEOUT)
  );
  try {
    return await Promise.race([Promise.any(attempts), deadline]);
  } catch (err) {
    return null;
  }
}

const memo = new Map<string, { expires: number; promise: Promise<ComickResult> }>();

export function getComickChapters(titles: string[]): Promise<ComickResult> {
  const list = [...new Set(titles.map((t) => t.trim()).filter(Boolean))].slice(0, 4);
  if (list.length === 0) return Promise.resolve(null);
  const key = list.join("|").toLowerCase();
  const hit = memo.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise;

  const promise = run(list);
  const entry = { expires: Date.now() + TTL_FAIL, promise };
  memo.set(key, entry);
  promise.then((r) => { if (r) entry.expires = Date.now() + TTL_OK; });
  return promise;
}

// ==========================================
// FUNGSI BARU UNTUK HERO (100% COMICK)
// ==========================================
export async function getComickHeroManga() {
  // Daftar komik populer untuk ditampilkan di Hero
  const popularTitles = ["Solo Leveling", "One Piece", "Jujutsu Kaisen", "Chainsaw Man", "My Hero Academia"];
  
  const results = await Promise.all(popularTitles.map(t => getComickChapters([t])));
  
  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((r) => ({
      id: r.mangaUrl, // Gunakan URL sebagai ID untuk membedakan dari MangaDex/AniList
      title: r.title,
      img: r.coverUrl,
      type: "Manga", 
      rating: 5,
      chapters: r.chapters.length.toString()
    }));
}

export async function getComickChapterPages(chapterHid: string, source: string): Promise<string[]> {
  try {
    const targetUrl = decodeURIComponent(chapterHid);
    let data = null;
    try {
      data = await fetchViaProxy(`${COMICK_API_BASE}/api/pages`, {
        method: "POST",
        body: JSON.stringify({ url: targetUrl, source }),
      });
    } catch (e) {
      data = await fetchViaProxy(`${COMICK_API_BASE}/api/chapter`, {
        method: "POST",
        body: JSON.stringify({ url: targetUrl, source }),
      });
    }
    const images = data?.images ?? data?.pages ?? data?.data ?? [];
    return Array.isArray(images)
      ? images.map((img: any) => {
          const url = typeof img === "string" ? img : img.url || img.b2key;
          return (url && !url.startsWith("http")) ? `https://meo.comick.pictures/${url}` : url;
        })
      : [];
  } catch (error) {
    return [];
  }
}
