import { Play, Star } from "lucide-react";
import { recentChapters } from "@/data/mockData";

export default function Sidebar() {
  return (
    <div className="space-y-8">
      {/* RECENT CHAPTERS */}
      <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
        <div className="flex justify-between border-b border-gray-200 pb-2 mb-3">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Chapter Terbaru</h3>
          <button className="text-xs text-gray-400 hover:text-gray-900">Lihat Semua</button>
        </div>
        <div className="space-y-4">
          {recentChapters.map((ch, idx) => (
            <div key={idx} className="flex gap-3 group cursor-pointer">
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 relative">
                <img src={ch.img} alt={ch.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Play className="w-4 h-4 text-white fill-current" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-bold leading-tight text-gray-800 group-hover:text-gray-500 transition">{ch.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{ch.chapter}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ch.views}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMIC OF THE WEEK */}
      <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
        <div className="flex justify-between border-b border-gray-200 pb-2 mb-3">
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Komik Minggu Ini</h3>
        </div>
        <div className="flex gap-3 mb-3">
          <img src="https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=100&q=80" alt="Comic" className="w-20 h-28 object-cover rounded" />
          <div>
            <p className="text-xs text-gray-500">Action, Supernatural</p>
            <h4 className="font-bold text-sm text-gray-800">Jujutsu Kaisen</h4>
            <div className="flex text-gray-800 text-xs mt-1 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
              <span className="text-gray-400 ml-1">(2.1k reviews)</span>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p><strong className="text-gray-700">Status:</strong> Ongoing</p>
              <p><strong className="text-gray-700">Author:</strong> Gege Akutami</p>
            </div>
          </div>
        </div>
        <button className="w-full border border-gray-900 text-gray-900 py-1.5 rounded text-sm font-semibold hover:bg-gray-100 transition">Tambah ke Koleksi</button>
      </div>
    </div>
  );
}