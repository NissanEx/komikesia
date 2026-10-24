import { NextRequest, NextResponse } from "next/server";
import { getMangaByCategory } from "@/lib/mangadex";
import { getKomiktapPopularManga } from "@/lib/komiktap";
import { getAnilistPopularManga } from "@/lib/anilist";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const category = searchParams.get("category") || "Semua";
  const sort = searchParams.get("sort") || "Populer";
  const source = searchParams.get("source") || "Semua";

  try {
    if (source === "Komiktap") {
      const result = await getKomiktapPopularManga(page);
      return NextResponse.json({ data: result.data, total: result.total });
    }

    if (source === "AniList") {
      const raw = await getAnilistPopularManga();
      const filtered = category === "Semua" ? raw : raw.filter((c: any) => c.type === category);
      const offset = (page - 1) * limit;
      return NextResponse.json({ data: filtered.slice(offset, offset + limit), total: filtered.length });
    }

    if (source === "MangaDex") {
      const result = await getMangaByCategory(category, sort, page, limit);
      return NextResponse.json({ data: result.data, total: result.total });
    }

    // JIKA SEMUA: Hanya MangaDex & AniList (Komiktap dilewati agar tidak timeout)
    const [mdxRes, aniRes] = await Promise.allSettled([
      getMangaByCategory(category, sort, page, limit),
      getAnilistPopularManga()
    ]);

    const mdxData = mdxRes.status === "fulfilled" ? mdxRes.value.data : [];
    const aniData = aniRes.status === "fulfilled" ? aniRes.value : [];

    const combined = [...mdxData, ...aniData].slice(0, limit);

    return NextResponse.json({ 
      data: combined, 
      total: (mdxRes.status === "fulfilled" ? mdxRes.value.total : 0) + aniData.length
    });

  } catch (error) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 }); 
  }
}