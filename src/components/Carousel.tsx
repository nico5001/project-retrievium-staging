"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface CarouselProps { images: string[]; }

export default function Carousel({ images }: CarouselProps) {
  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      spaceBetween={20}
      slidesPerView={3}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 2500, disableOnInteraction: false }}
      loop
    >
      {images.map((src,i)=>(
        <SwiperSlide key={i}>
          <img src={src} alt={`NFT ${i+1}`} className="w-full rounded-lg object-cover"/>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
