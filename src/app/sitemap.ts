import { MetadataRoute } from 'next'
import { getPopularManga } from '@/lib/mangadex'
import { getAnilistPopularManga } from '@/lib/anilist'
import { getKomikuPopularManga } from '@/lib/komiku'

type SitemapEntry = MetadataRoute.Sitemap[number];

async function getAllComics() {
  try {
    // Ambil data populer/terbaru. Ambil sekitar 100-200 per sumber agar tidak timeout.
    const [mdxRes, aniRes, komikuRes] = await Promise.allSettled([
      getPopularManga(), 
      getAnilistPopularManga(),
      getKomikuPopularManga(1, 100, "Semua")
    ]);

    const mdxData = mdxRes.status === "fulfilled" ? mdxRes.value.data : [];
    const aniData = aniRes.status === "fulfilled" ? aniRes.value : [];
    const komikuData = komikuRes.status === "fulfilled" ? komikuRes.value.data : [];

    // Gabungkan dan hilangkan duplikat
    const all = [...mdxData, ...aniData, ...komikuData];
    const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
    
    return unique;
  } catch (error) {
    console.error("Gagal mengambil data untuk sitemap:", error);
    return [];
  }
}

// Fungsi standar (TIDAK pakai generateSitemaps lagi)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://komiknet.site';
  
  // 1. Halaman Statis Wajib
  const staticRoutes: SitemapEntry[] = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/katalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 2. Halaman Dinamis (Semua Judul Komik)
  const comics = await getAllComics();
  const comicRoutes: SitemapEntry[] = comics.map((comic: any) => ({
    url: `${baseUrl}/comic/${comic.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...comicRoutes];
}