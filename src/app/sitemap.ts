import { MetadataRoute } from 'next'
import { getPopularManga } from '@/lib/mangadex'
import { getAnilistPopularManga } from '@/lib/anilist'
import { getKomikuPopularManga } from '@/lib/komiku'

// Tipe data dari fungsi kita
type SitemapEntry = MetadataRoute.Sitemap[number];

// Fungsi untuk mengambil semua data komik dari berbagai sumber
async function getAllComics() {
  try {
    // Ambil data dalam jumlah besar (misal 100-200 per sumber)
    const [mdxRes, aniRes, komikuRes] = await Promise.allSettled([
      getPopularManga(), // Pastikan fungsi ini bisa menerima parameter limit jika perlu
      getAnilistPopularManga(),
      getKomikuPopularManga(1, 100, "Semua")
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

// Fungsi generateSitemaps: Memecah sitemap menjadi beberapa file
export async function generateSitemaps() {
  const comics = await getAllComics();
  const CHUNK_SIZE = 100; // Maksimal 100 URL per file agar Google cepat memproses
  const numberOfSitemaps = Math.ceil(comics.length / CHUNK_SIZE);

  return Array.from({ length: numberOfSitemaps }, (_, i) => ({ id: i }));
}

// Fungsi utama pembuat sitemap
export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://komiknet.vercel.app';
  const CHUNK_SIZE = 100;
  const comics = await getAllComics();

  // Halaman statis: Hanya dimasukkan ke sitemap pertama (id: 0)
  const staticRoutes: SitemapEntry[] = id === 0 ? [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // Prioritas tertinggi untuk halaman utama
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

  // Halaman Dinamis: Ambil potongan data sesuai 'id' sitemap
  const start = id * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  const chunkedComics = comics.slice(start, end);

  const comicRoutes: SitemapEntry[] = chunkedComics.map((comic: any) => ({
    url: `${baseUrl}/comic/${comic.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8, // Prioritas tinggi untuk halaman detail komik
  }));

  return [...staticRoutes, ...comicRoutes];
}