import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import DownloadAppModal from "@/components/DownloadAppModal";
import Header from "@/components/Header"; 
import ConditionalHeader from "@/components/ConditionalHeader";
import Footer from "@/components/Footer"; 
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // ... metadata kamu
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      {/* Pastikan body dan pembungkusnya berwarna sama */}
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#f4f4f4] antialiased`}>
        <Script 
          src="https://app.sandbox.midtrans.com/snap/snap.js" 
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="beforeInteractive" 
        />
        
        <ConditionalHeader>
          <Header />
        </ConditionalHeader>
        
        <DownloadAppModal />

        {/* Tambahkan bg-[#f4f4f4] di sini juga untuk jaga-jaga */}
        <div className="flex-grow flex flex-col w-full bg-[#f4f4f4]">
          {children}
        </div>
        
        <Footer />
      </body>
    </html>
  );
}