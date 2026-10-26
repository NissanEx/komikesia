"use client";

import Link from "next/link";

export default function AdBanner({ 
  imageUrl = "https://placehold.co/728x90/d97706/ffffff?text=Sponsor+Komik+Network",
  linkUrl = "/subscription",
  label = "SPONSOR",
  isInternal = true
}: { 
  imageUrl?: string; 
  linkUrl?: string;
  label?: string;
  isInternal?: boolean;
}) {
  
  const Content = () => (
    <div className="relative w-full max-w-3xl mx-auto my-4 group">
      <div className="absolute -top-3 left-4 bg-gray-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 z-10 tracking-widest uppercase">
        {label}
      </div>
      <div className="border-2 border-gray-900 bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center min-h-[90px]">
        <img 
          src={imageUrl} 
          alt="Advertisement" 
          className="w-full h-auto object-contain max-h-[250px]" 
        />
      </div>
    </div>
  );

  if (isInternal) {
    return <Link href={linkUrl}>{Content()}</Link>;
  }

  return (
    <a href={linkUrl} target="_blank" rel="noopener noreferrer">
      {Content()}
    </a>
  );
}