import { NextResponse } from "next/server";

// Map domain ke referer yang sesuai
const REFERER_MAP: Record<string, string> = {
  "komiku.org": "https://komiku.org/",
  "komiktap": "https://komiktap.info/",
  "mangadex.org": "https://mangadex.org/",
  "comick": "https://comick.io/",
  "nyora": "https://nyora.app/",
  "anilist.co": "https://anilist.co/",   // Tambahan untuk AniList
  "anili.st": "https://anilist.co/",     // Tambahan untuk AniList CDN
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("URL gambar tidak ditemukan", { status: 400 });
  }

  // Cegah error jika frontend tidak sengaja mengirim object (url=[object Object])
  if (imageUrl.includes("[object")) {
    console.error("[IMAGE PROXY ERROR] URL tidak valid (Object):", imageUrl);
    return NextResponse.redirect("https://placehold.co/400x600/png?text=Gambar+Error");
  }

  try {
    // 1. Tentukan referer berdasarkan domain
    let referer = "https://komiktap.info/"; // Default fallback
    const lowerUrl = imageUrl.toLowerCase();

    for (const [domain, ref] of Object.entries(REFERER_MAP)) {
      if (lowerUrl.includes(domain)) {
        referer = ref;
        break;
      }
    }

    // Fallback jika domain tidak dikenali
    if (referer === "https://komiktap.info/") {
      try {
        referer = new URL(imageUrl).origin;
      } catch (e) {}
    }

    // 2. Fetch gambar
    const res = await fetch(imageUrl, {
      cache: 'force-cache', 
      next: { revalidate: 86400 }, 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer, 
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        // HAPUS header Sec-Fetch-* karena sering diblokir oleh AniList/Cloudflare
      },
      signal: AbortSignal.timeout(5000) 
    });

    if (!res.ok) {
      throw new Error(`Status: ${res.status} ${res.statusText}`);
    }

    // 3. Return response
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", 
      },
    });

  } catch (error) {
    console.error(`[IMAGE PROXY ERROR] Gagal memuat ${imageUrl.substring(0, 50)}...: ${(error as Error).message}`);
    return NextResponse.redirect("https://placehold.co/400x600/png?text=Gambar+Error");
  }
}