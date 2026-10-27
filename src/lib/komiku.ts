import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const KOMIKU_BASE = "https://komiku.org"; 
const KOMIKU_API = "https://api.komiku.org";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Mapping Slug Genre
const GENRE_SLUGS: Record<string, string> = {
  "Action": "action",
  "Romance": "romance", 
  "Isekai": "isekai",
  "Murim": "martial-arts", 
  "School Life": "school-life",
  "Fantasy": "fantasy",
  "Comedy": "comedy",
  "Horror": "horror",
  "Mystery": "mystery"
};

// ==========================================
// FUNGSI BANTUAN UNTUK MEMBERSIHKAN URL
// ==========================================
function cleanUrl(url: string, base: string = KOMIKU_BASE): string {
  if (!url) return "";
  let clean = url.trim();
  
  // Jika diawali '//', ubah jadi 'https://'
  if (clean.startsWith("//")) {
    clean = `https:${clean}`;
  } 
  // Jika tidak diawali 'http', gabungkan dengan base URL
  else if (!clean.startsWith("http")) {
    // Pastikan tidak ada double slash saat menggabungkan
    clean = `${base}${clean.startsWith("/") ? "" : "/"}${clean}`;
  }
  
  // Bersihkan double slash yang tidak perlu (kecuali pada 'https://')
  clean = clean.replace(/([^:]\/)\/+/g, "$1");
  
  return clean;
}

async function fetchHtml(url: string): Promise<string> {
  try {
    let targetUrl = url;
    
    // JIKA DI PRODUCTION (CLOUDFLARE), GUNAKAN PROXY VERCEL
    if (process.env.NODE_ENV === "production") {
      // Ganti dengan URL Vercel kamu yang barusan
      const vercelProxy = "https://anilist-proxy-alpha.vercel.app/api/scrape";
      targetUrl = `${vercelProxy}?url=${encodeURIComponent(url)}`;
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": KOMIKU_BASE, 
      },
      signal: AbortSignal.timeout(15000), // Naikkan timeout karena lewat proxy
    });
    if (res.ok) return await res.text();
  } catch (error) {
    console.log(`[KOMIKU] Fetch error pada ${url}: ${(error as Error).message}`);
  }
  return "";
}

function parseKomikuPage(html: string): any[] {
  const $ = cheerio.load(html);
  const comics: any[] = [];
  const seenIds = new Set<string>();

  const possibleSelectors = ['.bge', '.manga-item', '.list-comic', '.comic-item', '.item'];

  for (const selector of possibleSelectors) {
    $(selector).each((i, el) => {
      const container = $(el);
      const linkEl = container.find('a[href*="/manga/"], a[href*="/komik/"]').first();
      const href = linkEl.attr('href');
      
      if (!href) return;

      const imgEl = container.find('img').first();
      let img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || "";
      if (!img || img.startsWith('data:image')) return;

      let title = container.find('.judul, .title, h3, h4, .tpel_inf').text().trim() 
               || linkEl.attr('title') 
               || imgEl.attr('alt') 
               || linkEl.text().trim();

      if (!title) {
        const urlParts = href.split('/').filter(Boolean);
        if (urlParts.length > 0) {
          title = urlParts[urlParts.length - 1].replace(/-/g, ' ');
        }
      }
      
      title = title.replace(/^(Sampul|Cover)\s+/i, '').replace(/\s+/g, ' ').trim();

      let chapterNumber = "?";
      const chapterLink = container.find('a[href*="chapter-"], a[href*="ch-"]').last();
      if (chapterLink.length > 0) {
        const chapterHref = chapterLink.attr('href') || "";
        const matchUrl = chapterHref.match(/(?:chapter|ch)-(\d+(\.\d+)?)/i);
        if (matchUrl) {
          chapterNumber = matchUrl[1];
        } else {
          const textMatch = chapterLink.text().match(/(\d+(\.\d+)?)/);
          if (textMatch) chapterNumber = textMatch[1];
        }
      } else {
        const chapterText = container.find('.up, .newch, .chapter').text();
        const matchText = chapterText.match(/(\d+(\.\d+)?)/);
        if (matchText) chapterNumber = matchText[0];
      }

      if (title && title.length > 2) {
        // PERBAIKAN: Gunakan cleanUrl
        const fullUrl = cleanUrl(href);
        const fullImg = cleanUrl(img);
        const comicId = `komiku:${encodeURIComponent(fullUrl)}`;

        if (!seenIds.has(comicId)) {
          seenIds.add(comicId);
          const cardText = container.text().toLowerCase();
          let typeText = "Manga";
          if (cardText.includes("manhwa")) typeText = "Manhwa";
          else if (cardText.includes("manhua")) typeText = "Manhua";

          comics.push({
            id: comicId, 
            title, 
            type: typeText, 
            img: fullImg, 
            rating: 5, 
            readers: "Komiku", 
            chapters: chapterNumber, 
            source: "komiku" as const
          });
        }
      }
    });
    if (comics.length > 0) break;
  }

  return comics;
}

// ==========================================
// SCRAPING (Hanya berjalan di LOCAL)
// ==========================================
export async function scrapeKomikuPopular(
  page: number = 1, 
  limit: number = 20, 
  category: string = "Semua",
  genre: string = "Semua"
): Promise<{ data: any[], total: number }> {
  try {
    let allComics: any[] = [];
    let baseUrl = `${KOMIKU_API}/manga`;
    
    if (genre !== "Semua" && GENRE_SLUGS[genre]) {
      baseUrl = `${KOMIKU_API}/genre/${GENRE_SLUGS[genre]}`;
    }

    const pagesToFetch = 10; 
    const urlsToFetch = Array.from({ length: pagesToFetch }, (_, i) => 
      `${baseUrl}/page/${i + 1}/`
    );

    const fetchPromises = urlsToFetch.map(url => fetchHtml(url));
    const htmlResults = await Promise.all(fetchPromises);
    
    htmlResults.forEach(html => {
      if (html) allComics.push(...parseKomikuPage(html));
    });

    if (allComics.length === 0 && genre !== "Semua") {
      const webBaseUrl = `${KOMIKU_BASE}/genre/${GENRE_SLUGS[genre]}`;
      const webUrls = Array.from({ length: pagesToFetch }, (_, i) => 
        i === 0 ? `${webBaseUrl}/` : `${webBaseUrl}/page/${i + 1}/`
      );
      const webHtmls = await Promise.all(webUrls.map(url => fetchHtml(url)));
      webHtmls.forEach(html => {
        if (html) allComics.push(...parseKomikuPage(html));
      });
    }

    if (category !== "Semua") {
      allComics = allComics.filter((c) => c.type.toLowerCase() === category.toLowerCase());
    }

    const seen = new Set<string>();
    const uniqueComics = allComics.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    const offset = (page - 1) * limit;
    const paginatedData = uniqueComics.slice(offset, offset + limit);

    return { data: paginatedData, total: uniqueComics.length };
  } catch (error) {
    console.error("[KOMIKU] Gagal ambil populer:", error);
    return { data: [], total: 0 };
  }
}

// ==========================================
// BACA DARI SUPABASE (Digunakan Situs Production)
// ==========================================
export async function getKomikuPopularManga(
  page: number = 1,
  limit: number = 20,
  category: string = 'Semua',
  genre: string = 'Semua'
): Promise<{ data: any[]; total: number }> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  let q = sb.from('komiku_comics').select('id,title,type,img,chapters', { count: 'exact' });
  if (category !== 'Semua') q = q.ilike('type', category);
  if (genre !== 'Semua') q = q.contains('genres', [genre]);

  const from = (page - 1) * limit;
  const { data, count, error } = await q.order('rank', { ascending: true }).range(from, from + limit - 1);
  
  if (!error && data && data.length > 0) {
    return {
      data: data.map((c) => ({ ...c, rating: 5, readers: 'Komiku', source: 'komiku' as const })),
      total: count ?? data.length,
    };
  }

  // Fallback scraping (hanya untuk localhost)
  if (process.env.NODE_ENV !== 'production') {
    return scrapeKomikuPopular(page, limit, category, genre);
  }
  
  return { data: [], total: 0 };
}

export async function getKomikuMangaDetail(url: string) {
  try {
    const cleanMangaUrl = cleanUrl(url);
    const html = await fetchHtml(cleanMangaUrl);
    
    // JIKA GAGAL FETCH (Diblokir Cloudflare/Timeout)
    if (!html) {
      const slug = cleanMangaUrl.split("/manga/")[1]?.replace("/", "") || "komik";
      return {
        title: slug.replace(/-/g, " ").toUpperCase(),
        img: "https://placehold.co/400x600/png?text=Gambar+Tidak+Tersedia",
        description: "Gagal memuat deskripsi dari Komiku (Server memblokir akses).",
        chapters: [],
        url: cleanMangaUrl
      };
    }

    const $ = cheerio.load(html);
    const title = $('h1[itemprop="name"], .judul h1, h1').first().text().trim() || "Judul Tidak Diketahui";
    let img = $('img[itemprop="image"], .ims img, .thumb img').attr('src') || "";
    img = cleanUrl(img);
    
    const description = $('.desc, #sinopsis, [itemprop="description"]').text().trim().replace(/\s+/g, ' ') || "Belum ada deskripsi.";
    
    const chapters: any[] = [];
    $('#daftarChapter tr, .chapter-list a, table tr').each((i, el) => {
      const linkEl = $(el).find('a');
      const link = linkEl.attr('href');
      const chapterName = linkEl.text().trim();
      
      if (link && chapterName && !link.includes('manga/')) {
        const fullUrl = cleanUrl(link);
        const chapterNumber = chapterName.match(/\d+(\.\d+)?/)?.[0] || chapterName;
        chapters.push({ id: fullUrl, chapter: chapterNumber, title: chapterName, publishAt: null });
      }
    });
    
    return { title, img, description, chapters, url: cleanMangaUrl };
  } catch (error) {
    return null;
  }
}

// ==========================================
// FUNGSI GAMBAR CHAPTER
// ==========================================
export async function getKomikuChapterPages(url: string): Promise<string[]> {
  try {
    if (!url.startsWith("http")) return [];
    const cleanChapterUrl = cleanUrl(url);
    const html = await fetchHtml(cleanChapterUrl);
    if (!html) return [];
    
    const $ = cheerio.load(html);
    const images: string[] = [];
    const possibleSelectors = ['#Baca_Komik img', '.main-reading-area img', '.chapter-img img', '#readerarea img', '.reading-content img'];
    
    for (const selector of possibleSelectors) {
      const foundImages = $(selector);
      if (foundImages.length > 0) {
        foundImages.each((i, el) => {
          // Ambil URL gambar
          let src = $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('data-lazy-src') || $(el).attr('src');
          // Ambil teks alt gambar
          let alt = ($(el).attr('alt') || "").toLowerCase();

          if (src && !src.startsWith('data:')) {
            const fullImg = cleanUrl(src);
            const lowerImg = fullImg.toLowerCase();

            // 1. Daftar kata kunci yang menandakan gambar promosi/iklan
            const blacklistUrls = ["logo", "banner", "promo", "iklan", "credit", "natsu", "donasi", "komiku.org/wp-content/plugins"];
            const blacklistAlts = ["komiku", "baca", "iklan", "promo", "credit"];

            // 2. Cek apakah URL mengandung kata kunci blacklist
            const isUrlBlacklisted = blacklistUrls.some(keyword => lowerImg.includes(keyword));
            
            // 3. Cek apakah Alt text mengandung kata kunci blacklist
            const isAltBlacklisted = blacklistAlts.some(keyword => alt.includes(keyword));

            // 4. Jika lolos dari blacklist, masukkan ke array images
            if (!isUrlBlacklisted && !isAltBlacklisted) {
              images.push(fullImg);
            }
          }
        });
        if (images.length > 0) break;
      }
    }
    return images;
  } catch (error) {
    return [];
  }
}

// ==========================================
// FUNGSI PENCARIAN (SEARCH SUPABASE DULU)
// ==========================================
export async function searchKomiku(query: string): Promise<any[]> {
  try {
    // 1. CARI DI SUPABASE TERLEBIH DAHULU
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await sb
      .from('komiku_comics')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(20);

    if (!error && data && data.length > 0) {
      return data.map(c => ({
        ...c,
        rating: 5,
        readers: "Komiku",
        source: "komiku"
      }));
    }

    // 2. JIKA TIDAK KETEMU DI DB & SEDANG DI LOCALHOST, LAKUKAN SCRAPING
    if (process.env.NODE_ENV !== 'production') {
      let allResults: any[] = [];
      const seenIds = new Set<string>();
      const maxPages = 3;

      for (let page = 1; page <= maxPages; page++) {
        const apiUrl = `${KOMIKU_API}/?s=${encodeURIComponent(query)}&post_type=manga&paged=${page}`;
        const apiHtml = await fetchHtml(apiUrl);
        if (!apiHtml) break;

        const parsed = parseKomikuPage(apiHtml);
        if (parsed.length === 0) break;

        parsed.forEach((c: any) => {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            allResults.push(c);
          }
        });
      }

      return allResults;
    }

    return [];
  } catch (error) {
    console.error("[KOMIKU] Gagal search:", error);
    return [];
  }
}