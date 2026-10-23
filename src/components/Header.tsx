import { Search } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black text-gray-900 tracking-tighter">
            <span className="text-gray-400">7</span> COMIC<span className="text-gray-500">NETWORK</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-500">
            <a href="#" className="hover:text-gray-900">Beranda</a>
            <a href="#" className="text-gray-900 border-b-2 border-gray-900 pb-5 mt-5">Katalog</a>
            <a href="#" className="hover:text-gray-900">Bookmark</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input type="text" placeholder="Cari judul manga, manhwa..." className="bg-gray-100 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-64 text-gray-700 placeholder-gray-400" />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>Hello, Reader</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}