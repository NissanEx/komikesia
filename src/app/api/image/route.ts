import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) return new NextResponse("URL gambar tidak ditemukan", { status: 400 });

  try {
    // 1. Ambil domain asal gambar untuk dijadikan Referer
    let referer = "https://komiktap.info/";
    try {
      const urlObj = new URL(imageUrl);
      referer = urlObj.origin;
    } catch (e) {}

    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": referer, 
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
    });

    if (!res.ok) throw new Error(`Gagal mengambil gambar: ${res.status}`);

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error(`[IMAGE PROXY] Gagal memuat gambar: ${(error as Error).message}`);
    return NextResponse.redirect("https://via.placeholder.com/400x600?text=Gambar+Error");
  }
}