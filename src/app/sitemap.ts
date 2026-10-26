import { MetadataRoute } from 'next'
import { getPopularManga } from '@/lib/mangadex'
import { getAnilistPopularManga } from '@/lib/anilist'
import { getKomikuPopularManga } from '@/lib/komiku'

// Simpan di cache Vercel selama 1 jam agar Googlebot mendapat respons instan
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

async function getAllComics() {
  try {
    // Ambil data secara paralel. 
    // Batasi jumlahnya agar tidak memberatkan server saat Googlebot merayapi.
    const [mdxRes, aniRes, komikuRes] = await Promise.allSettled([
      getPopularManga(), 
      getAnilistPopularManga(),
      getKomikuPopularManga(1, 100, "Semua") // Batasi 100 komik dari Komiku
    ]);

    const mdxData = mdxRes.status === "fulfilled" ? mdxRes.value.data : [];
    const aniData = aniRes.status === "fulfilled" ? aniRes.value : [];
    const komikuData = komikuRes.status === "fulfilled" ? komikuRes.value.data : [];

    // Gabungkan dan hilangkan duplikat berdasarkan ID
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
  
  // 1. Halaman Statis Wajib
  const staticRoutes: SitemapEntry[] = [
    { 
      url: baseUrl, 
      lastModified: new Date(), 
      changeFrequency: 'daily', 
      priority: 1.0 
    },
    { 
      url: `${baseUrl}/katalog`, 
      lastModified: new Date(), 
      changeFrequency: 'daily', 
      priority: 0.9 
    },
    { 
      url: `${baseUrl}/login`, 
      lastModified: new Date(), 
      changeFrequency: 'monthly', 
      priority: 0.5 
    },
    { 
      url: `${baseUrl}/register`, 
      lastModified: new Date(), 
      changeFrequency: 'monthly', 
      priority: 0.5 
    },
    { 
      url: `${baseUrl}/privacy`, 
      lastModified: new Date(), 
      changeFrequency: 'yearly', 
      priority: 0.3 
    },
    { 
      url: `${baseUrl}/terms`, 
      lastModified: new Date(), 
      changeFrequency: 'yearly', 
      priority: 0.3 
    },
    { 
      url: `${baseUrl}/download`, 
      lastModified: new Date(), 
      changeFrequency: 'monthly', 
      priority: 0.6 
    }
  ];

  // 2. Halaman Dinamis (Komik)
  const comics = await getAllComics();
  
  const comicRoutes: SitemapEntry[] = comics
    .filter((comic: any) => comic && comic.id) // Pastikan ID tidak kosong
    .map((comic: any) => ({
      // Encode ID untuk mengantisipasi karakter aneh seperti / atau :
      url: `${baseUrl}/comic/${encodeURIComponent(comic.id)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Gabungkan semua rute
  return [...staticRoutes, ...comicRoutes];
}