import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { scrapeKomikuPopular } from '../src/lib/komiku';

const GENRES = ['Semua', 'Action', 'Romance', 'Isekai', 'Murim', 'School Life', 'Fantasy', 'Comedy', 'Horror', 'Mystery'];

const sb = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  try {
    const map = new Map<string, any>();

    for (const genre of GENRES) {
      console.log(`Mengambil data genre: ${genre}...`);
      const { data } = await scrapeKomikuPopular(1, 1000, 'Semua', genre);
      
      for (const c of data) {
        const row = map.get(c.id) ?? {
          id: c.id, 
          title: c.title, 
          type: c.type, 
          img: c.img, 
          chapters: c.chapters,
          rank: map.size, 
          genres: new Set<string>(),
        };
        
        if (genre !== 'Semua') {
          row.genres.add(genre);
        }
        
        map.set(c.id, row);
      }
      await new Promise((r) => setTimeout(r, 1500)); // Jeda sopan
    }

    const now = new Date().toISOString();
    const rows = [...map.values()].map((r) => ({ 
      ...r, 
      genres: [...r.genres], 
      updated_at: now 
    }));
    
    console.log(`\nTotal: ${rows.length} komik siap di-upload.`);

    if (rows.length === 0) {
      console.error('Hasil kosong, upsert dibatalkan.');
      process.exit(1);
    }

    // Upload per batch 500
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      console.log(`Mengunggah batch ${i + 1} - ${i + batch.length}...`);
      
      const { error } = await sb.from('komiku_comics').upsert(batch, { onConflict: 'id' });
      if (error) { 
        console.error(`Gagal upload batch ${i}:`, error.message); 
        process.exit(1); 
      }
    }
    
    console.log('✅ Selesai! Data berhasil masuk ke Supabase.');
  } catch (error) {
    console.error("Terjadi kesalahan fatal:", error);
  }
}

main();