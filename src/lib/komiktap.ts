import * as cheerio from 'cheerio';

const KOMIKTAP_BASE = "https://komiktap.info"; 
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ==========================================
// FUNGSI FETCH (RINGAN & CEPAT)
// ==========================================
async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": KOMIKTAP_BASE, 
      },
      signal: AbortSignal.timeout(8000), // Timeout 8 detik agar tidak crash di Vercel
    });
    
    if (res.ok) {
      return await res.text();
    }
  } catch (error) {
    console.log(`[KOMIKTAP] Fetch error: ${(error as Error).message}`);
  }
  return "";
}

// ==========================================
// 1. AMBIL DAFTAR KOMIK (DENGAN PAGINASI TOTAL)
// ==========================================
export async function getKomiktapPopularManga(page: number = 1): Promise<{ data: any[], total: number }> {
  try {
    const comics: any[] = [];
    const seenIds = new Set<string>();
    
    // Coba berbagai format URL untuk memastikan halaman benar-benar pindah
    let urlsToTry = page === 1 
      ? [KOMIKTAP_BASE] 
      : [
          `${KOMIKTAP_BASE}/manga/page/${page}/`,
          `${KOMIKTAP_BASE}/page/${page}/`
        ];

    let html = "";
    let usedUrl = "";

    for (const url of urlsToTry) {
      html = await fetchHtml(url);
      if (html && html.includes('/manga/')) {
        usedUrl = url;
        break;
      }
    }

    if (!html) return { data: [], total: 0 }; 
    
    const $ = cheerio.load(html);
    
    // ==========================================
    // DETEKSI TOTAL HALAMAN (SANGAT AGRESIF)
    // ==========================================
    let maxPage = 1;
    
    // 1. Cari teks "Page X of Y"
    const pageText = $('.wp-pagenavi .pages, .pagination .pages, .page-links').text();
    const matchOf = pageText.match(/of\s+([\d,]+)/i);
    if (matchOf) {
      maxPage = parseInt(matchOf[1].replace(/,/g, ''));
    } else {
      // 2. Cari angka terbesar di link paginasi
      $('.pagination a, .page-numbers, .wp-pagenavi a, .hpage a').each((i, el) => {
        const num = parseInt($(el).text().trim().replace(/,/g, ''));
        if (!isNaN(num) && num > maxPage) maxPage = num;
      });
    }

    // Jika tidak ketemu sama sekali, beri nilai default yang besar (misal 50 halaman)
    const safeMaxPage = maxPage > 1 ? maxPage : 50;
    const totalComics = safeMaxPage * 20;

    // ==========================================
    // EKSTRAK DATA KOMIK
    // ==========================================
    $('.bs, .bsx, .listupd .bs, .manga-item').each((i, el) => {
      const container = $(el);
      const linkEl = container.find('a').first();
      
      const href = linkEl.attr('href');
      if (!href || !href.includes('/manga/')) return;

      const title = linkEl.attr('title') || container.find('.tt').text().trim() || linkEl.text().trim();
      
      // Gambar: Prioritaskan data-src
      const imgEl = container.find('img').first();
      let img = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src') || "";
      
      // Abaikan jika gambar masih base64 (placeholder lazy load)
      if (img.startsWith('data:image')) return;

      if (title && img && title.length > 2) {
        const fullUrl = href.startsWith('http') ? href : `${KOMIKTAP_BASE}${href}`;
        let fullImg = img.startsWith('//') ? `https:${img}` : (img.startsWith('http') ? img : `${KOMIKTAP_BASE}${img}`);
        const comicId = `komiktap:${encodeURIComponent(fullUrl)}`;

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
            readers: "Komiktap", 
            chapters: "?", 
            source: "komiktap" as const
          });
        }
      }
    });

    console.log(`[KOMIKTAP] URL: ${usedUrl} | Hal ${page}/${safeMaxPage} | Ditemukan: ${comics.length} komik`);

    return { data: comics.slice(0, 20), total: totalComics };
  } catch (error) {
    console.error("[KOMIKTAP] Gagal ambil populer:", error);
    return { data: [], total: 0 };
  }
}

// ==========================================
// 2. AMBIL DETAIL KOMIK
// ==========================================
export async function getKomiktapMangaDetail(url: string) {
  try {
    const html = await fetchHtml(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    
    const title = $('.entry-title').text().trim() || $('.post-title h1').text().trim() || $('h1').first().text().trim();
    const img = $('.summary_image img').attr('src') || $('.thumb img').attr('src') || "";
    const description = $('.summary_content, .description-summary, .entry-content').text().trim() || "";
    
    let typeText = $('.post-content_item:contains("Type") .summary-content').text().trim() || "Manga";
    if (typeText.toLowerCase().includes('manhwa')) typeText = "Manhwa";
    else if (typeText.toLowerCase().includes('manhua')) typeText = "Manhua";
    else typeText = "Manga";
    
    const chapters: any[] = [];
    $('#chapterlist a, .wp-manga-chapter a, .cl-item a, .eplister a').each((i, el) => {
      const href = $(el).attr('href');
      const chapterText = $(el).text().trim();
      const chapterMatch = chapterText.match(/(?:Chapter|Ch\.?)\s*([0-9.]+)/i);
      
      if (href) {
        chapters.push({
          id: href.startsWith('http') ? href : `${KOMIKTAP_BASE}${href}`,
          chapter: chapterMatch ? chapterMatch[1] : null,
          title: chapterText,
          publishAt: null,
          source: "Komiktap",
        });
      }
    });

    return {
      id: `komiktap:${encodeURIComponent(url)}`,
      title: title || "Judul Tidak Diketahui",
      img: img.startsWith('http') ? img : (img.startsWith('//') ? `https:${img}` : `${KOMIKTAP_BASE}${img}`),
      description: description.replace(/\s+/g, ' ').slice(0, 300) + "...",
      type: typeText,
      url: url,
      chapters: chapters
    };
  } catch (error) {
    return null;
  }
}

// ==========================================
// 3. PENCARIAN CHAPTER BERDASARKAN JUDUL
// ==========================================
export async function getKomiktapChapters(titles: string[]): Promise<any> {
  const title = titles[0];
  if (!title) return null;

  try {
    const searchUrl = `${KOMIKTAP_BASE}/?s=${encodeURIComponent(title)}`;
    const html = await fetchHtml(searchUrl);
    if (!html) return null;
    const $ = cheerio.load(html);

    const mangaLink = $('a[href*="/manga/"]').first().attr('href');
    if (!mangaLink) return null;

    const mangaUrl = mangaLink.startsWith('http') ? mangaLink : `${KOMIKTAP_BASE}${mangaLink}`;
    const detail = await getKomiktapMangaDetail(mangaUrl);
    
    if (!detail) return null;
    return {
      sourceId: "komiktap",
      mangaUrl,
      chapters: detail.chapters
    };
  } catch (error) {
    return null;
  }
}

// ==========================================
// 4. AMBIL GAMBAR HALAMAN CHAPTER
// ==========================================
export async function getKomiktapChapterPages(chapterUrl: string): Promise<string[]> {
  try {
    if (!chapterUrl.startsWith("http")) return [];

    const html = await fetchHtml(chapterUrl);
    if (!html) return [];
    let images: string[] = [];

    // Metode 1: Bongkar Script TS_Reader
    const tsReaderIndex = html.indexOf("ts_reader.run(");
    if (tsReaderIndex !== -1) {
      const startBrace = html.indexOf("{", tsReaderIndex);
      const endScript = html.indexOf("</script>", tsReaderIndex);
      
      if (startBrace !== -1 && endScript !== -1) {
        const jsonStr = html.substring(startBrace, endScript).trim().replace(/\);?\s*$/, '');
        try {
          const data = JSON.parse(jsonStr);
          if (data?.sources && Array.isArray(data.sources)) {
            for (const source of data.sources) {
              if (source.images && Array.isArray(source.images)) {
                images.push(...source.images);
              }
            }
          }
        } catch (e) {}
      }
    }

    // Metode 2: Fallback Cari di Tag IMG
    if (images.length === 0) {
      const $ = cheerio.load(html);
      $('.reading-content img, .page-break img, #readerarea img, .entry-content img').each((i, el) => {
        let src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
        if (src) {
          src = src.trim();
          if (!src.includes('logo') && !src.includes('loading') && !src.endsWith('.gif') && !src.includes('1x1')) {
            images.push(src);
          }
        }
      });
    }

    return images.map(img => img.startsWith('//') ? `https:${img}` : img);
  } catch (error) {
    return [];
  }
}