// src/app/api/nyora-proxy/[...slug]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.slug.join("/");
  const searchParams = req.nextUrl.search;

  // ✅ Gunakan endpoint Cloud Helper yang resmi
  const targetUrl = `https://api.hasanraza.tech/${path}${searchParams}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "Origin": "https://web.nyora.xyz",
        "Referer": "https://web.nyora.xyz/",
        "Accept": "application/json",
        // ❌ HAPUS header Authorization untuk Cloud API
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[PROXY] Nyora API Error: ${res.status} - ${errorBody}`);
      return NextResponse.json(
        { error: `Nyora API Error: HTTP ${res.status}`, details: errorBody },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PROXY] Fetch Error:", error);
    return NextResponse.json(
      { error: "Proxy error: " + (error as Error).message },
      { status: 500 }
    );
  }
}