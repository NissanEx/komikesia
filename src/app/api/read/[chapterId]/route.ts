// src/app/api/read/[chapterId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getChapterImages, getMangaChapters } from "@/lib/mangadex";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const mangaId = req.nextUrl.searchParams.get("mangaId");
  
  if (!mangaId) return NextResponse.json({ error: "Missing mangaId" }, { status: 400 });

  const result = await getChapterImages(chapterId);
  
  let nextChapterId = null;
  if (!result.externalUrl) {
    try {
      const chaptersData = await getMangaChapters(mangaId);
      const allChapters = chaptersData?.data || [];
      const sortedChapters = [...allChapters].sort(
        (a: any, b: any) => (parseFloat(a.attributes.chapter) || 0) - (parseFloat(b.attributes.chapter) || 0)
      );
      const currentIndex = sortedChapters.findIndex((c: any) => c.id === chapterId);
      
      if (currentIndex !== -1 && currentIndex < sortedChapters.length - 1) {
        nextChapterId = sortedChapters[currentIndex + 1].id;
      }
    } catch (error) {
      console.log("[API READER] Gagal mencari chapter selanjutnya:", error);
    }
  }

  return NextResponse.json({
    chapterId,
    chapterNumber: result.chapterNumber, // <-- Kirim nomor chapter
    images: result.images,
    externalUrl: result.externalUrl,
    nextChapterId
  });
}