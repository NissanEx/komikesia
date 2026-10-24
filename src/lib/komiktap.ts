import * as cheerio from 'cheerio';

const KOMIKTAP_BASE = "https://komiktap.info"; 
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Fungsi Fetch Ringan (Tanpa Puppeteer)
async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": KOMIKTAP_BASE, 
      },
      signal: AbortSignal.timeout(5000), // Timeout ketat 5 detik
    });
    
    if (res.ok) {
      return await res.text();
    }
  } catch (error) {
    console.log(`[KOMIKTAP] Fetch gagal/timeout.`);
  }
  return "";
}

// ==========================================
// 1. AMBIL DAFTAR KOMIK
// ==========================================
export async function getKomiktapPopularManga(page: number = 1): Promise<{ data: any[], total: number }> {
  try {
    const url = page === 1 ? KOMIKTAP_BASE : `${KOMIKTAP_BASE}/manga/page/${page}/`;
    const html = await fetchHtml(url);
    if (!html) return { data: [], total: 0 }; 
    
    const $ = cheerio.load(html);
    const comics: any[] = [];
    
    $('.bs, .bsx, .listupd .bs').each((i, el) => {
      const container = $(el);
      const linkEl = container.find('a').first();
      const href = linkEl.attr('href');
      if (!href || !href.includes('/manga/')) return;

      const title = linkEl.attr('title') || container.find('.tt').text().trim() || linkEl.text().trim();
      const imgEl = container.find('img').first();
      let img = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src') || "";
      
      if (img.startsWith('data:image')) return;

      if (title && img && title.length > 2) {
        const fullUrl = href.startsWith('http') ? href : `${KOMIKTAP_BASE}${href}`;
        let fullImg = img.startsWith('//') ? `https:${img}` : (img.startsWith('http') ? img : `${KOMIKTAP_BASE}${img}`);
        const comicId = `komiktap:${encodeURIComponent(fullUrl)}`;
        
        let typeText = container.text().toLowerCase().includes("manhwa") ? "Manhwa" : container.text().toLowerCase().includes("manhua") ? "Manhua" : "Manga";
        
        comics.push({
          id: comicId, title, type: typeText, img: fullImg, rating: 5, readers: "Komiktap", chapters: "?", source: "komiktap"
        });
      }
    });

    return { data: comics.slice(0, 20), total: 2000 };
  } catch (error) {
    return { data: [], total: 0 };
  }
}

// ==========================================
// 2. DETAIL & CHAPTER KOMIKTAP
// ==========================================
export async function getKomiktapMangaDetail(url: string) {
  try {
    const html = await fetchHtml(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    
    const title = $('.entry-title').text().trim() || $('.post-title h1').text().trim() || $('h1').first().text().trim();
    const img = $('.summary_image img').attr('src') || $('.thumb img').attr('src') || "";
    const description = $('.summary_content, .description-summary, .entry-content').text().trim() || "";
    
    const chapters: any[] = [];
    $('#chapterlist a, .wp-manga-chapter a, .eplister a').each((i, el) => {
      const href = $(el).attr('href');
      const chapterText = $(el).text().trim();
      const chapterMatch = chapterText.match(/(?:Chapter|Ch\.?)\s*([0-9.]+)/i);
      if (href) {
        chapters.push({
          id: href.startsWith('http') ? href : `${KOMIKTAP_BASE}${href}`,
          chapter: chapterMatch ? chapterMatch[1] : null,
          title: chapterText, publishAt: null, source: "Komiktap",
        });
      }
    });

    return {
      id: `komiktap:${encodeURIComponent(url)}`, title: title || "Judul Tidak Diketahui",
      img: img.startsWith('http') ? img : `${KOMIKTAP_BASE}${img}`,
      description: description.slice(0, 300) + "...", type: "Manga", url: url, chapters: chapters
    };
  } catch (error) { return null; }
}

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
    return { sourceId: "komiktap", mangaUrl, chapters: detail.chapters };
  } catch (error) { return null; }
}

export async function getKomiktapChapterPages(chapterUrl: string): Promise<string[]> {
  try {
    if (!chapterUrl.startsWith("http")) return [];
    const html = await fetchHtml(chapterUrl);
    if (!html) return [];
    let images: string[] = [];

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
              if (source.images && Array.isArray(source.images)) images.push(...source.images);
            }
          }
        } catch (e) {}
      }
    }

    if (images.length === 0) {
      const $ = cheerio.load(html);
      $('.reading-content img, .page-break img, #readerarea img').each((i, el) => {
        let src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
        if (src && !src.includes('logo') && !src.includes('loading')) images.push(src);
      });
    }
    return images.map(img => img.startsWith('//') ? `https:${img}` : img);
  } catch (error) { return []; }
}