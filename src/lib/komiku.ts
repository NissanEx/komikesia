import * as cheerio from 'cheerio';

const KOMIKU_BASE = "https://komiku.org"; 
const KOMIKU_API = "https://api.komiku.org";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": KOMIKU_BASE, 
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(15000),
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

      // ==========================================
      // EKSTRAKSI CHAPTER DARI URL TERBARU (AKURAT)
      // ==========================================
      let chapterNumber = "?";
      
      // Cari link chapter terbaru di dalam kartu komik
      const chapterLink = container.find('a[href*="chapter-"], a[href*="ch-"]').last();
      if (chapterLink.length > 0) {
        const chapterHref = chapterLink.attr('href') || "";
        // Ekstrak angka dari URL (contoh: ".../chapter-65/" -> "65")
        const matchUrl = chapterHref.match(/(?:chapter|ch)-(\d+(\.\d+)?)/i);
        if (matchUrl) {
          chapterNumber = matchUrl[1];
        } else {
          // Fallback ke teks link jika URL aneh
          const textMatch = chapterLink.text().match(/(\d+(\.\d+)?)/);
          if (textMatch) chapterNumber = textMatch[1];
        }
      } else {
        // Fallback ke elemen text biasa
        const chapterText = container.find('.up, .newch, .chapter').text();
        const matchText = chapterText.match(/(\d+(\.\d+)?)/);
        if (matchText) chapterNumber = matchText[0];
      }

      if (title && title.length > 2) {
        const fullUrl = href.startsWith('http') ? href : `${KOMIKU_BASE}${href}`;
        let fullImg = img.startsWith('//') ? `https:${img}` : (img.startsWith('http') ? img : `${KOMIKU_BASE}${img}`);
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
export async function getKomikuPopularManga(page: number = 1, limit: number = 20, category: string = "Semua"): Promise<{ data: any[], total: number }> {
  try {
    const apiPage1 = (page - 1) * 2 + 1;
    const apiPage2 = apiPage1 + 1;

    // Hanya fetch 2 halaman secara paralel (jauh lebih cepat)
    const [html1, html2] = await Promise.all([
      fetchHtml(`${KOMIKU_API}/manga/page/${apiPage1}/`),
      fetchHtml(`${KOMIKU_API}/manga/page/${apiPage2}/`)
    ]);

    const comics1 = html1 ? parseKomikuPage(html1) : [];
    const comics2 = html2 ? parseKomikuPage(html2) : [];
    
    let combined = [...comics1, ...comics2];

    if (category !== "Semua") {
      combined = combined.filter((c) => c.type.toLowerCase() === category.toLowerCase());
    }

    const seen = new Set<string>();
    const uniqueComics = combined.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    return { data: uniqueComics.slice(0, limit), total: 1000 };
  } catch (error) {
    console.error("[KOMIKU] Gagal ambil populer:", error);
    return { data: [], total: 0 };
  }
}

export async function getKomikuMangaDetail(url: string) {
  try {
    const html = await fetchHtml(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    const title = $('h1[itemprop="name"], .judul h1, h1').first().text().trim() || "Judul Tidak Diketahui";
    let img = $('img[itemprop="image"], .ims img, .thumb img').attr('src') || "";
    if (img.startsWith('//')) img = `https:${img}`;
    const description = $('.desc, #sinopsis, [itemprop="description"]').text().trim().replace(/\s+/g, ' ') || "Belum ada deskripsi.";
    
    const chapters: any[] = [];
    $('#daftarChapter tr, .chapter-list a, table tr').each((i, el) => {
      const linkEl = $(el).find('a');
      const link = linkEl.attr('href');
      const chapterName = linkEl.text().trim();
      if (link && chapterName && !link.includes('manga/')) {
        const fullUrl = link.startsWith('http') ? link : `${KOMIKU_BASE}${link}`;
        const chapterNumber = chapterName.match(/\d+(\.\d+)?/)?.[0] || chapterName;
        chapters.push({ id: fullUrl, chapter: chapterNumber, title: chapterName, publishAt: null });
      }
    });
    return { title, img, description, chapters, url };
  } catch (error) {
    return null;
  }
}

export async function getKomikuChapterPages(url: string): Promise<string[]> {
  try {
    if (!url.startsWith("http")) return [];
    const html = await fetchHtml(url);
    if (!html) return [];
    const $ = cheerio.load(html);
    const images: string[] = [];
    const possibleSelectors = ['#Baca_Komik img', '.main-reading-area img', '.chapter-img img', '#readerarea img', '.reading-content img'];
    
    for (const selector of possibleSelectors) {
      const foundImages = $(selector);
      if (foundImages.length > 0) {
        foundImages.each((i, el) => {
          let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('data-lazy-src');
          if (src) {
            if (src.startsWith('//')) src = `https:${src}`;
            else if (!src.startsWith('http')) src = `${KOMIKU_BASE}${src}`;
            if (!src.toLowerCase().includes('logo') && !src.toLowerCase().includes('banner')) images.push(src);
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

export async function searchKomiku(query: string): Promise<any[]> {
  try {
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

    if (allResults.length > 0) return allResults;

    for (let page = 1; page <= maxPages; page++) {
      const webUrl = page === 1 
        ? `${KOMIKU_BASE}/?s=${encodeURIComponent(query)}`
        : `${KOMIKU_BASE}/page/${page}/?s=${encodeURIComponent(query)}`;
      
      const webHtml = await fetchHtml(webUrl);
      if (!webHtml) break;

      const parsed = parseKomikuPage(webHtml);
      if (parsed.length === 0) break;

      parsed.forEach((c: any) => {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          allResults.push(c);
        }
      });
    }

    return allResults;
  } catch (error) {
    console.error("[KOMIKU] Gagal search:", error);
    return [];
  }
}