import { MessageSquare } from "lucide-react";

// PASTIKAN ADA "export default" DI SINI
export default function NewsFeed() {
  return (
    <div>
      <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
        <h2 className="text-lg font-bold text-gray-900">Berita Terbaru</h2>
        <a href="#" className="text-sm text-gray-400 hover:text-gray-900">Lihat Semua</a>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex gap-4 group cursor-pointer">
            <div className="w-48 h-32 flex-shrink-0 overflow-hidden rounded">
              <img src="https://images.unsplash.com/photo-1541562232579-512a21360020?w=300&q=80" alt="News" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Posted on 13/08</p>
              <h3 className="font-bold text-gray-800 group-hover:text-gray-500 transition">Adaptasi Anime Solo Leveling Umumkan Tanggal Rilis Perdana</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">Studio A-1 Pictures secara resmi merilis trailer terbaru untuk adaptasi webtoon populer Solo Leveling, memperlihatkan aksi Sung Jin-Woo...</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <MessageSquare className="w-3 h-3" /> 22 komentar
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}