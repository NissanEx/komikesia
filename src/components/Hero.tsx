import { Bookmark, Share2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <img src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&q=80" alt="Hero" className="w-full h-full object-cover object-top" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <div className="max-w-lg space-y-4">
          <span className="bg-gray-100 text-gray-900 text-xs font-bold px-2 py-1 uppercase tracking-wider">Action, Fantasy</span>
          <h1 className="text-5xl font-black leading-tight uppercase">
            Solo Leveling <br />
            <span className="text-gray-400">Chapter Terbaru</span><br />
            Telah Rilis!
          </h1>
          <p className="text-gray-200">Sung Jin-Woo, pemburu terlemah, mendapatkan sistem misterius yang memungkinkannya untuk level up tanpa batas. Ikuti perjalanannya menjadi pemburu terkuat!</p>
          <div className="flex gap-4 pt-4">
            <button className="bg-white text-gray-900 hover:bg-gray-200 font-bold py-2 px-6 rounded transition">Baca Sekarang</button>
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded text-sm transition border border-gray-700"><Bookmark className="w-4 h-4"/> Bookmark</button>
            <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded text-sm transition border border-gray-700"><Share2 className="w-4 h-4"/> Share</button>
          </div>
        </div>
      </div>
    </section>
  );
}