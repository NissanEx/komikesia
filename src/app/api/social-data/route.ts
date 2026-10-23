import { NextResponse } from 'next/server';

// Tipe data sederhana untuk hasil normalisasi
type SocialPost = {
  id: string;
  platform: string;
  message: string;
  created_time: string;
  permalink_url?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const pageId = process.env.META_PAGE_ID;
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return NextResponse.json(
      { error: 'Konfigurasi Meta API belum lengkap di .env.local' },
      { status: 500 }
    );
  }

  try {
    // 1. Ambil feed (postingan) dari Halaman Facebook
    const fields = 'id,message,created_time,permalink_url,comments{message,created_time}';
    const fbUrl = `https://graph.facebook.com/v20.0/${pageId}/feed?fields=${fields}&access_token=${accessToken}&limit=25`;

    const response = await fetch(fbUrl, { next: { revalidate: 3600 } }); // Cache selama 1 jam

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gagal mengambil data dari Facebook');
    }

    const data = await response.json();

    // 2. Normalisasi data agar sesuai dengan struktur aplikasi kita
    const normalizedPosts: SocialPost[] = [];
    
    data.data?.forEach((post: any) => {
      // Filter sederhana berdasarkan keyword (jika ada)
      if (keyword && !post.message?.toLowerCase().includes(keyword.toLowerCase())) {
        return;
      }

      // Tambahkan postingan utama
      if (post.message) {
        normalizedPosts.push({
          id: post.id,
          platform: 'Facebook',
          message: post.message,
          created_time: post.created_time,
          permalink_url: post.permalink_url,
        });
      }

      // Tambahkan komentar sebagai item terpisah untuk analisis sentimen
      post.comments?.data?.forEach((comment: any) => {
        if (comment.message) {
          normalizedPosts.push({
            id: comment.id,
            platform: 'Facebook (Comment)',
            message: comment.message,
            created_time: comment.created_time,
          });
        }
      });
    });

    return NextResponse.json({ posts: normalizedPosts, total: normalizedPosts.length });

  } catch (error: any) {
    console.error('Meta API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}