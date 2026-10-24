import { Nyora, NyoraError, NyoraHTTPError } from "nyora-sdk";
import { connection } from "next/server";

const client = new Nyora();
const FALLBACK_SOURCES = ["comick", "mangafire", "asurascans", "mangaplus"];

export type NyoraChapter = {
  id: string;
  chapter: string | null;
  title: string | null;
  publishAt: string | null;
  source: string;
};

export type NyoraChaptersResult = {
  sourceId: string;
  mangaUrl: string;
  chapters: NyoraChapter[];
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} melebihi ${ms}ms`)), ms)
    ),
  ]);
}

export async function getNyoraChapters(
  mangaTitle: string,
): Promise<NyoraChaptersResult | null> {
  await connection(); 
  console.log(`[NYORA] Mencari komik: "${mangaTitle}"...`);

  for (const sourceName of FALLBACK_SOURCES) {
    const t0 = Date.now();
    try {
      const source = await withTimeout(client.sources.find(sourceName), 5000, `find ${sourceName}`);
      if (!source?.id) continue;

      const searchResult = await withTimeout(client.manga.search(source.id, mangaTitle), 10000, `search ${sourceName}`);
      const entries = searchResult?.entries ?? [];
      if (entries.length === 0) continue;

      const entry = entries[0];
      const details = await withTimeout(client.manga.details(source.id, entry.url, { title: entry.title }), 15000, `details ${sourceName}`);
      const chapters = details?.chapters ?? [];
      if (chapters.length === 0) continue;

      console.log(`[NYORA] ✅ ${source.name}: ${chapters.length} chapter diambil (${Date.now() - t0}ms)`);

      return {
        sourceId: source.id,
        mangaUrl: entry.url,
        chapters: chapters.map((ch: any) => ({
          id: encodeURIComponent(ch.url),
          chapter: ch.number ?? null,
          title: ch.title ?? null,
          publishAt: ch.uploadedAt ?? null,
          source: source.name,
        })),
      };
    } catch (err) {
      const elapsed = Date.now() - t0;
      console.warn(`[NYORA] ❌ ${sourceName} (${elapsed}ms): ${(err as Error)?.message ?? err}`);
    }
  }
  return null;
}

export async function getNyoraChapterPages(
  sourceId: string,
  chapterUrl: string,
): Promise<string[]> {
  try {
    await connection();
    const decodedUrl = decodeURIComponent(chapterUrl);
    const pages = await withTimeout(client.manga.pages(sourceId, decodedUrl), 15000, `pages ${chapterUrl}`);
    return (pages ?? []).map((p: any) => p.url);
  } catch (error) {
    console.error("[NYORA] Gagal ambil halaman:", error);
    return [];
  }
}