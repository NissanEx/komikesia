"use client";

import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

export default function FeaturedSlider({ comics }: { comics: any[] }) {
  if (!comics || comics.length === 0) return null;

  return (
    <section className="py-16 bg-[#f4f4f4] overflow-hidden relative">
      
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex justify-between items-end pb-3">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900">
            Rekomendasi Pilihan
          </h2>
        </div>
      </div>

      <div className="w-full flex justify-center">
        <Swiper
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={"auto"}
          loop={true}
          // Jarak tumpukan disesuaikan sedikit karena kartu lebih besar
          spaceBetween={-60} 
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          coverflowEffect={{
            rotate: 0,       
            stretch: 0,      
            depth: 150,      
            modifier: 1,   
            slideShadows: false, 
          }}
          pagination={{ clickable: true }}
          modules={[EffectCoverflow, Pagination, Autoplay]}
          className="w-full max-w-6xl !pb-16"
        >
          {comics.map((comic) => (
            // UKURAN DIPERBESAR: 150px di HP, 200px di Desktop
            <SwiperSlide key={comic.id} className="!w-[150px] md:!w-[200px] transition-all duration-500">
              
              <Link 
                href={`/comic/${comic.id}`} 
                className="block relative aspect-[3/4] bg-gray-900 border-2 border-gray-900 overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
              >
                <img
                  src={`/api/image?url=${encodeURIComponent(comic.img)}`}
                  alt={comic.title}
                  className="w-full h-full object-cover"
                />
                
                {/* OVERLAY JUDUL */}
                <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-sm p-2 md:p-3 border-t-2 border-gray-900">
                  {/* Font size dinaikkan sedikit agar tetap terbaca di kartu yang lebih besar */}
                  <h3 className="font-black text-[10px] md:text-xs text-white leading-tight uppercase line-clamp-2">
                    {comic.title}
                  </h3>
                </div>
              </Link>

            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .swiper-slide {
          transition: all 0.5s ease;
          filter: grayscale(100%) brightness(0.6);
          opacity: 0.6;
          transform: scale(0.9);
        }
        
        .swiper-slide-active {
          filter: grayscale(0%) brightness(1);
          opacity: 1;
          transform: scale(1) !important; 
          z-index: 20;
        }

        .swiper-pagination {
          bottom: 0px !important;
        }
        .swiper-pagination-bullet {
          background: #9ca3af !important; 
          opacity: 1 !important;
          border-radius: 0 !important;
          width: 20px;
          height: 4px;
          transition: all 0.3s ease;
          margin: 0 4px !important;
        }
        .swiper-pagination-bullet-active {
          background: #d97706 !important; 
          width: 40px; 
        }
      `}</style>
    </section>
  );
}