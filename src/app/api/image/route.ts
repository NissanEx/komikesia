import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("URL gambar tidak ditemukan", { status: 400 });
  }

  try {
    // ==========================================
    // 1. TENTUKAN REFERER BERDASARKAN DOMAIN
    // ==========================================
    let referer = "https://komiktap.info/"; // Default fallback
    
    const lowerUrl = imageUrl.toLowerCase();
    
    if (lowerUrl.includes("komiku.org")) {
      referer = "https://komiku.org/";
    } else if (lowerUrl.includes("komiktap")) {
      referer = "https://komiktap.info/";
    } else if (lowerUrl.includes("mangadex.org")) {
      referer = "https://mangadex.org/";
    } else if (lowerUrl.includes("comick")) {
      referer = "https://comick.io/";
    } else if (lowerUrl.includes("nyora")) {
      referer = "https://nyora.app/";
    } else {
      // Jika tidak dikenali, coba ambil origin dari URL (seperti kode lama)
      try {
        const urlObj = new URL(imageUrl);
        referer = urlObj.origin;
      } catch (e) {}
    }

    // ==========================================
    // 2. FETCH GAMBAR DENGAN HEADER LENGKAP
    // ==========================================
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer, 
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site"
      },
      // Tambahkan timeout agar tidak menggantung selamanya jika server lambat
      signal: AbortSignal.timeout(15000) 
    });

    if (!res.ok) {
      throw new Error(`Status: ${res.status} ${res.statusText}`);
    }

    // ==========================================
    // 3. KEMBALIKAN RESPONSE GAMBAR
    // ==========================================
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache gambar selama 1 hari (86400 detik) untuk menghemat bandwidth
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", 
      },
    });

  } catch (error) {
    console.error(`[IMAGE PROXY ERROR] Gagal memuat ${imageUrl}: ${(error as Error).message}`);
    
    // Redirect ke placeholder jika gagal total
    return NextResponse.redirect("https://placehold.co/400x600/png?text=Gambar+Error");
  }
}