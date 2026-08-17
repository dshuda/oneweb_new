'use client';

import { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils';
import { serviceCategories as fallbackCategories } from '@/app/data/services';
import { api } from '@/lib/api';

type ServiceCategory = {
  id: string;
  name: string;
  sub: string;
  slug: string;
  icon: any;
};

export default function ServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>(fallbackCategories);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/v1/services/categories');
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ServiceCategory[] = data.map((cat: any) => {
            const nameParts = (cat.name || '').split(' ');
            const firstName = nameParts[0] || cat.name;
            const subName = nameParts.slice(1).join(' ') || 'Service';
            return {
              id: cat.id,
              name: firstName,
              sub: subName,
              slug: cat.slug || firstName.toLowerCase(),
              icon: resolveImageUrl(cat.serviceIcon || cat.bannerImage, '/service-icons/icon_cleaning.svg'),
            };
          });
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = 280;
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    updateScrollButtons(newScrollLeft, container.scrollWidth);
  };

  const updateScrollButtons = (scrollLeft: number, scrollWidth: number) => {
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - 400);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    updateScrollButtons(container.scrollLeft, container.scrollWidth);
  };

  return (
    <section className="relative bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* White Container */}
          <div className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-border/50 sm:p-5">
            {/* Categories Row */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="scrollbar-hide flex gap-3 overflow-x-auto pb-1 sm:gap-4"
            >
              {serviceCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group flex w-[104px] shrink-0 flex-col items-center gap-2.5 rounded-2xl py-4 transition-transform hover:-translate-y-0.5 sm:w-[110px]"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/5 text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                    {typeof category.icon === 'string' ? (
                      <Image
                        src={category.icon}
                        alt={category.name}
                        width={42}
                        height={42}
                        className="h-8 w-8"
                      />
                    ) : (
                      <category.icon size={26} strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="text-center text-xs font-semibold leading-snug text-foreground sm:text-[13px]">
                    {category.name}
                    <br />
                    {category.sub}
                  </span>
                </Link>
              ))}

              {/* All Services card — navigates to the browse categories page */}
              <Link
                href="/services"
                className="group flex w-[104px] shrink-0 flex-col items-center gap-2.5 rounded-2xl py-4 transition-transform hover:-translate-y-0.5 sm:w-[110px]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary transition-colors group-hover:border-primary/60 group-hover:bg-primary/10">
                  <FiPlus size={24} />
                </span>
                <span className="text-center text-xs font-semibold leading-snug text-foreground sm:text-[13px]">
                  All
                  <br />
                  Services
                </span>
              </Link>
            </div>
          </div>

          {/* Left Scroll Button */}
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className={`absolute top-1/2 -left-3 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-primary shadow-lg transition-colors hover:bg-primary hover:text-white sm:flex lg:-left-4 ${
              canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <FiChevronLeft size={20} />
          </button>

          {/* Right Scroll Button */}
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className={`absolute top-1/2 -right-3 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-primary shadow-lg transition-colors hover:bg-primary hover:text-white sm:flex lg:-right-4 ${
              canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
