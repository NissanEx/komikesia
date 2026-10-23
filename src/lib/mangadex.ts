// Cek apakah kita perlu menggunakan proxy (hanya untuk dev lokal)
const USE_PROXY = process.env.USE_PROXY === 'true';

// URL Builder - otomatis pakai proxy jika diaktifkan di .env
function buildUrl(targetUrl: string) {
  if (USE_PROXY) {
    return `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl; // Di Vercel, langsung tembak MangaDex
}

// Fungsi fetch dengan timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// --- DATA DUMMY (Jaring Pengaman) ---
const fallbackComics = [
  { id: "fallback-1", title: "Solo Leveling", type: "Manhwa", img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80", rating: 5, readers: "1.2M", chapters: "179" },
  { id: "fallback-2", title: "One Piece", type: "Manga", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80", rating: 5, readers: "3.5M", chapters: "1090" },
  { id: "fallback-3", title: "Martial Peak", type: "Manhua", img: "https://images.unsplash.com/photo-1541562232579-512a21360020?w=400&q=80", rating: 4, readers: "890K", chapters: "3100" },
  { id: "fallback-4", title: "Jujutsu Kaisen", type: "Manga", img: "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&q=80", rating: 5, readers: "1.8M", chapters: "250" },
];

// 1. Ambil Detail Komik
export async function getMangaById(id: string) {
  // Jika ID adalah data fallback, kembalikan null (tidak ada detail)
  if (id.startsWith('fallback-')) return null;

  try {
    const url = buildUrl(`https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=author`);
    const response = await fetchWithTimeout(url, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error("Gagal ambil manga");
    return await response.json();
  } catch (error) {
    console.error(`Error manga ${id}:`, error);
    return null;
  }
}

// 2. Ambil Chapter
export async function getMangaChapters(id: string) {
  if (id.startsWith('fallback-')) return { data: [] };

  try {
    const url = buildUrl(`https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=desc`);
    const response = await fetchWithTimeout(url, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error("Gagal ambil chapter");
    return await response.json();
  } catch (error) {
    console.error(`Error chapter ${id}:`, error);
    return { data: [] };
  }
}

// 3. Ambil Komik Populer
export async function getPopularManga() {
  try {
    const url = buildUrl("https://api.mangadex.org/manga?limit=8&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive");
    const response = await fetchWithTimeout(url, {
      next: { revalidate: 3600 } // Cache 1 jam agar tidak spam API
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    return data.data.map((manga: any) => {
      const coverArt = manga.relationships.find((rel: any) => rel.type === "cover_art");
      
      // URL cover juga menggunakan proxy jika aktif
      const coverUrl = coverArt 
        ? `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}.256.jpg`
        : "https://via.placeholder.com/400x600?text=No+Image";
      
      const img = USE_PROXY 
        ? `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(coverUrl)}`
        : coverUrl;

      let type = "Manga";
      if (manga.attributes.originalLanguage === "ko") type = "Manhwa";
      if (manga.attributes.originalLanguage === "zh" || manga.attributes.originalLanguage === "zh-hk") type = "Manhua";

      return {
        id: manga.id,
        title: manga.attributes.title.en || manga.attributes.title["ja-ro"] || "Judul Tidak Diketahui",
        type: type,
        img: img,
        rating: 5,
        readers: manga.attributes.followedCount ? `${(manga.attributes.followedCount / 1000).toFixed(1)}K` : "0",
        chapters: manga.attributes.lastChapter || "?",
      };
    });
  } catch (error) {
    console.warn("⚠️ API gagal, menggunakan data dummy:", error);
    return fallbackComics;
  }
}