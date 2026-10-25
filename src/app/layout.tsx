import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Gunakan URL Vercel Anda saat ini
  metadataBase: new URL("https://komiknet.vercel.app"), 
  title: {
    default: "KomikNet - Baca Komik, Manga, Manhwa, Manhua Terlengkap",
    template: "%s | KomikNet", 
  },
  description: "Platform baca komik online gratis. Tersedia ribuan Manga, Manhwa, Manhua, dan Komik dari berbagai sumber dengan update chapter terbaru.",
  keywords: ["baca komik", "komik online", "manga", "manhwa", "manhua", "komiknet"],
  authors: [{ name: "KomikNet" }],
  creator: "KomikNet",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://komiknet.vercel.app",
    title: "KomikNet - Baca Komik Online",
    description: "Baca ribuan komik, manga, manhwa, dan manhua terlengkap dan terbaru.",
    siteName: "KomikNet",
  },
  twitter: {
    card: "summary_large_image",
    title: "KomikNet - Baca Komik Online",
    description: "Baca ribuan komik, manga, manhwa, dan manhua terlengkap dan terbaru.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}