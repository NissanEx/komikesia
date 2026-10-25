import { MetadataRoute } from 'next'
import { getPopularManga } from '@/lib/mangadex'
import { getAnilistPopularManga } from '@/lib/anilist'
import { getKomikuPopularManga } from '@/lib/komiku'

type SitemapEntry = MetadataRoute.Sitemap[number];

// 1. Simpan data di cache agar tidak di-fetch berulang kali
let cachedComics: any[] | null = null;

async function getAllComics() {
  if (cachedComics) return cachedComics;

  try {
    const [mdxRes, aniRes, komikuRes] = await Promise.allSettled([
      getPopularManga(),
      getAnilistPopularManga(),
      getKomikuPopularManga(1, 100, "Semua")
    ]);

    const mdxData = mdxRes.status === "fulfilled" ? mdxRes.value.data : [];
    const aniData = aniRes.status === "fulfilled" ? aniRes.value : [];
    const komikuData = komikuRes.status === "fulfilled" ? komikuRes.value.data : [];

    const all = [...mdxData, ...aniData, ...komikuData];
    const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
    
    cachedComics = unique;
    return unique;
  } catch (error) {
    console.error("Gagal mengambil data untuk sitemap:", error);
    return [];
  }
}

export async function generateSitemaps() {
  const comics = await getAllComics();
  const CHUNK_SIZE = 100; 
  const numberOfSitemaps = Math.ceil(comics.length / CHUNK_SIZE);

  // Jika tidak ada data, setidaknya buat 1 sitemap
  if (numberOfSitemaps === 0) return [{ id: 0 }];

  return Array.from({ length: numberOfSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // 2. UBAH BASE URL KE DOMAIN BARU
  const baseUrl = 'https://komiknet.site';
  const CHUNK_SIZE = 100;
  const comics = await getAllComics();

  const staticRoutes: SitemapEntry[] = id === 0 ? [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/katalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ] : [];

  const start = id * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  const chunkedComics = comics.slice(start, end);

  const comicRoutes: SitemapEntry[] = chunkedComics.map((comic: any) => ({
    url: `${baseUrl}/comic/${comic.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...comicRoutes];
}