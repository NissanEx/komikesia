import { NextRequest, NextResponse } from "next/server";
import { getMangaByCategory } from "@/lib/mangadex";
import { getKomiktapPopularManga } from "@/lib/komiktap";
import { getAnilistPopularManga } from "@/lib/anilist";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const category = searchParams.get("category") || "Semua";
  const sort = searchParams.get("sort") || "Populer";
  const source = searchParams.get("source") || "Semua";

  const noCacheHeaders = {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
  };

  try {
    if (source === "Komiktap") {
      const result = await getKomiktapPopularManga(page);
      let filteredData = result.data;
      if (category !== "Semua") {
        filteredData = result.data.filter((c: any) => c.type === category);
      }
      return NextResponse.json({ data: filteredData.slice(0, limit), total: result.total }, { headers: noCacheHeaders });
    }

    if (source === "AniList") {
      const rawResult = await getAnilistPopularManga();
      let filteredData = rawResult;
      if (category !== "Semua") filteredData = rawResult.filter((c: any) => c.type === category);
      const offset = (page - 1) * limit;
      return NextResponse.json({ data: filteredData.slice(offset, offset + limit), total: filteredData.length }, { headers: noCacheHeaders });
    }

    if (source === "MangaDex") {
      const result = await getMangaByCategory(category, sort, page, limit);
      return NextResponse.json({ data: result.data, total: result.total }, { headers: noCacheHeaders });
    }

    // JIKA SEMUA (MangaDex + AniList, Komiktap opsional tergantung koneksi)
    const results = await Promise.allSettled([
      getMangaByCategory(category, sort, page, limit),
      getAnilistPopularManga()
    ]);

    const mdxData = results[0].status === "fulfilled" ? results[0].value.data : [];
    const mdxTotal = results[0].status === "fulfilled" ? results[0].value.total : 0;
    const aniData = results[1].status === "fulfilled" ? results[1].value : [];

    const combined = [...mdxData, ...aniData].slice(0, limit);

    return NextResponse.json({ 
      data: combined, 
      total: mdxTotal + aniData.length 
    }, { headers: noCacheHeaders });

  } catch (error) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200, headers: noCacheHeaders }); 
  }
}