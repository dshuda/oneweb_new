// components/PromotionalSlider.tsx

"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { PromotionItem } from "@/types/home/response";
import Link from "next/link";



interface Props {
  items: PromotionItem[];
}

export default function PromotionalSlider({
  items,
}: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;

    const amount = 350;

    sliderRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };
  const gradientDirection = [
    'bg-gradient-to-b',
    'bg-gradient-to-r',
    'bg-gradient-to-l',
    'bg-gradient-to-t',
  ];



  return (
    <div className="relative w-full max-w-7xl py-6 mx-auto scrollbar-hide">
      {/* Left Button */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Slider */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-10"
      >
        {items.map((item) => {
          const randomGradient = gradientDirection[Math.floor(Math.random() * gradientDirection.length)];
          return (
            <div
              key={item.id}
              className="relative min-w-[400px] h-[190px] rounded-3xl overflow-hidden flex-shrink-0"
            >
              {/* Background Image */}
             {item.image && (
               <Image
               src={item.image}
               alt={item.title}
               fill
               className="object-cover"
               />
              )} 

              {/* Overlay */}
              <div className={`absolute inset-0 ${randomGradient} from-purple-900/70 to-transparent`} />

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-center text-white">
                {item.subTitle && (
                  <p className="text-xs uppercase tracking-widest mb-2 text-gray-200">
                    {item.subTitle}
                  </p>
                )}

                <h2 className="text-3xl font-bold leading-tight max-w-[220px]">
                  {item.title}
                </h2>

                {item.buttonText && (
                  <Link href={item.link} className="mt-5 bg-white text-purple-700 w-fit px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition">
                    {item.buttonText}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right Button */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}