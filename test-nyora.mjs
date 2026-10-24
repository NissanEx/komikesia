import { Nyora } from "nyora-sdk";

async function runTest() {
  console.log("⏳ Memulai tes Nyora SDK...");
  const client = new Nyora();

  try {
    // 1. Cari sumber "comick" menggunakan method find()
    console.log("🔍 Mencari sumber 'comick'...");
    const source = await client.sources.find("comick"); // <-- Method yang benar
    console.log(`✅ Sumber ditemukan: ${source.name} (ID: ${source.id})`);

    // 2. Cari komik
    const searchQuery = "Ijiiranaide, Nagatoro-san";
    console.log(`🔍 Mencari komik: "${searchQuery}"...`);
    const search = await client.manga.search(source.id, searchQuery);
    
    if (!search.entries || search.entries.length === 0) {
      console.log("❌ Komik tidak ditemukan di sumber ini.");
      return;
    }

    const entry = search.entries[0];
    console.log(`✅ Komik ditemukan: ${entry.title}`);
    console.log(`🔗 URL: ${entry.url}`);

    // 3. Ambil detail chapter
    console.log("📚 Mengambil daftar chapter...");
    const details = await client.manga.details(source.id, entry.url, { title: entry.title });
    
    console.log(`✅ BERHASIL! Mendapatkan ${details.chapters.length} chapter.`);
    console.log("Contoh 3 chapter teratas:", details.chapters.slice(0, 3).map(c => ({
      chapter: c.number,
      title: c.title,
      url: c.url
    })));

    // 4. (Opsional) Coba ambil halaman gambar dari chapter pertama
    if (details.chapters.length > 0) {
      console.log("🖼️  Mencoba mengambil gambar chapter pertama...");
      const pages = await client.manga.pages(source.id, details.chapters[0].url);
      console.log(`✅ Berhasil mendapatkan ${pages.length} halaman gambar.`);
      console.log(`Contoh URL gambar: ${pages[0]?.url}`);
    }

  } catch (error) {
    console.error("❌ TERJADI ERROR PADA NYORA SDK:");
    console.error(error);
  }
}

runTest();