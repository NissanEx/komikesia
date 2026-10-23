export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-lg font-black text-white">
          <span className="text-gray-500">7</span> COMIC<span className="text-gray-500">NETWORK</span>
        </div>
        <div className="flex gap-6 text-sm font-semibold">
          <a href="#" className="hover:text-white transition">Beranda</a>
          <a href="#" className="hover:text-white transition">Katalog</a>
          <a href="#" className="hover:text-white transition">Bookmark</a>
        </div>
        <div className="text-xs text-center md:text-right space-y-1">
          <p>Copyright © 2024 Comic Network. All rights reserved.</p>
          <p>
            <a href="#" className="hover:text-white transition">Privacy Policy</a> | <a href="#" className="hover:text-white transition">Terms of Use</a> | <a href="#" className="hover:text-white transition">Sitemap</a>
          </p>
        </div>
      </div>
    </footer>
  );
}