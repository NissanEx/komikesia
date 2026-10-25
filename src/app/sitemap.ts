import { MetadataRoute } from 'next'
import { getPopularManga } from '@/lib/mangadex'
import { getAnilistPopularManga } from '@/lib/anilist'
import { getKomikuPopularManga } from '@/lib/komiku'

// KUNCI UTAMA: Simpan sitemap di cache Vercel selama 1 jam (3600 detik).
// Googlebot akan mendapatkan respons instan setelah cache terbentuk.
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

async function getAllComics() {
  try {
    // Ambil data. Batasi jumlahnya agar tidak memberatkan server Vercel.
    const [mdxRes, aniRes, komikuRes] = await Promise.allSettled([
      getPopularManga(), 
      getAnilistPopularManga(),
      getKomikuPopularManga(1, 50, "Semua") // Batasi 50 komik agar cepat
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://komiknet.site';
  
  // 1. Halaman Statis
  const staticRoutes: SitemapEntry[] = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/katalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 2. Halaman Dinamis (Komik)
  const comics = await getAllComics();
  
  const comicRoutes: SitemapEntry[] = comics
    .filter((comic: any) => comic && comic.id) // Pastikan ID valid
    .map((comic: any) => ({
      url: `${baseUrl}/comic/${comic.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticRoutes, ...comicRoutes];
}