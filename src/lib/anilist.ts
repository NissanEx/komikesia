// src/lib/anilist.ts

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export type AnilistManga = {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  status: string;
  chapters: number | null;
  volumes: number | null;
  averageScore: number;
  popularity: number;
  startDate: { year: number; month: number; day: number };
  countryOfOrigin: string;
  staff: { nodes: { name: { full: string } }[] };
};

async function fetchAnilist(query: string, variables: Record<string, any>) {
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const errorMsg = errorBody?.errors?.[0]?.message || `HTTP ${res.status}`;
      throw new Error(`AniList Error: ${errorMsg}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  } catch (error) {
    console.error("[ANILIST] Fetch Error:", (error as Error).message);
    return null;
  }
}

export async function getAnilistMangaBySearch(query: string): Promise<AnilistManga[]> {
  if (!query || query.trim() === "") return [];

  const gqlQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description
          coverImage { large }
          bannerImage
          genres
          status
          chapters
          volumes
          averageScore
          popularity
          startDate { year month day }
          countryOfOrigin
          staff(perPage: 2) { nodes { name { full } } }
        }
      }
    }
  `;

  const data = await fetchAnilist(gqlQuery, { search: query });
  if (!data?.Page?.media) return [];

  return data.Page.media.map((item: any) => ({
    id: item.id,
    title: item.title.english || item.title.romaji || item.title.native,
    description: item.description?.replace(/<[^>]*>?/gm, "") || "Belum ada deskripsi.",
    coverImage: item.coverImage?.large || "https://via.placeholder.com/400x600?text=No+Image",
    bannerImage: item.bannerImage || "",
    genres: item.genres || [],
    status: item.status || "UNKNOWN",
    chapters: item.chapters,
    volumes: item.volumes,
    averageScore: item.averageScore ? item.averageScore / 10 : 0,
    popularity: item.popularity || 0,
    startDate: item.startDate || { year: null, month: null, day: null },
    countryOfOrigin: item.countryOfOrigin || "JP",
    staff: item.staff || { nodes: [] },
  }));
}

export async function getAnilistMangaById(id: number): Promise<AnilistManga | null> {
  const gqlQuery = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        id
        title { romaji english native }
        description
        coverImage { large }
        bannerImage
        genres
        status
        chapters
        volumes
        averageScore
        popularity
        startDate { year month day }
        countryOfOrigin
        staff(perPage: 5) { nodes { name { full } } }
      }
    }
  `;

  const data = await fetchAnilist(gqlQuery, { id });
  const item = data?.Media;
  if (!item) return null;

  return {
    id: item.id,
    title: item.title.english || item.title.romaji || item.title.native,
    description: item.description?.replace(/<[^>]*>?/gm, "") || "Belum ada deskripsi.",
    coverImage: item.coverImage?.large || "https://via.placeholder.com/400x600?text=No+Image",
    bannerImage: item.bannerImage || "",
    genres: item.genres || [],
    status: item.status || "UNKNOWN",
    chapters: item.chapters,
    volumes: item.volumes,
    averageScore: item.averageScore ? item.averageScore / 10 : 0,
    popularity: item.popularity || 0,
    startDate: item.startDate || { year: null, month: null, day: null },
    countryOfOrigin: item.countryOfOrigin || "JP",
    staff: item.staff || { nodes: [] },
  };
}

// ==========================================
// FUNGSI POPULER DENGAN FILTER GENRE YANG DIPERBAIKI
// ==========================================
export async function getAnilistPopularManga(genre: string = "Semua"): Promise<any[]> {
  
  // PERBAIKAN: Jadikan genre sebagai array [String] atau null (jika "Semua")
  const genreVariable = genre !== "Semua" ? [genre] : null;

  const fetchByCountry = async (countryCode: string | null) => {
    const gqlQuery = `
      query ($country: CountryCode, $genre: [String]) {
        Page(page: 1, perPage: 50) {
          media(
            type: MANGA, 
            countryOfOrigin: $country,
            genre_in: $genre, 
            sort: POPULARITY_DESC,
            format_in: [MANGA, NOVEL, ONE_SHOT]
          ) {
            id
            title { romaji english native }
            coverImage { large }
            chapters
            averageScore
            popularity
          }
        }
      }
    `;
    const data = await fetchAnilist(gqlQuery, { country: countryCode, genre: genreVariable });
    return data?.Page?.media || [];
  };

  const [jpMedia, krMedia, cnMedia, twMedia] = await Promise.all([
    fetchByCountry("JP"),
    fetchByCountry("KR"),
    fetchByCountry("CN"),
    fetchByCountry("TW"),
  ]);

  const mapMedia = (item: any, type: string) => ({
    id: `anilist:${item.id}`,
    title: item.title.english || item.title.romaji || item.title.native,
    type: type,
    img: item.coverImage?.large || "https://via.placeholder.com/400x600?text=No+Image",
    averageScore: item.averageScore ? Math.round(item.averageScore / 10) : 0,
    popularity: item.popularity || 0,
    readers: item.popularity ? item.popularity.toLocaleString() : "AniList",
    chapters: item.chapters ? String(item.chapters) : "?",
    source: "anilist" as const,
  });

  return [
    ...jpMedia.map((m: any) => mapMedia(m, "Manga")),
    ...krMedia.map((m: any) => mapMedia(m, "Manhwa")),
    ...cnMedia.map((m: any) => mapMedia(m, "Manhua")),
    ...twMedia.map((m: any) => mapMedia(m, "Manhua")),
  ];
}