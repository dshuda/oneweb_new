'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ServiceCard from './ServiceCard';
import { Badge } from '@/components/ui/badge';
import { fetchTrendingServices, type CatalogService } from '@/app/lib/catalog';
import { getSliders, type ApiSlider } from '@/app/lib/api';
import { asset } from '@/app/lib/assets';

// 11d : 0h : 36m : 09s
const TARGET_SECONDS = 11 * 24 * 3600 + 36 * 60 + 9;

const pad = (n: number) => String(n).padStart(2, "0");

function getTimeLeft(target: number) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function EidOffer() {
  const [services, setServices] = useState<CatalogService[]>([]);
  // Promotional slides are managed in the portal (Offers / Sliders).
  const [slides, setSlides] = useState<ApiSlider[]>([]);

  // Same source as the trending row, so imagery and ids stay consistent.
  useEffect(() => {
    const controller = new AbortController();
    fetchTrendingServices(5, controller.signal)
      .then(setServices)
      .catch(() => setServices([]));
    getSliders(controller.signal)
      .then((all) => setSlides(all.filter((s) => s.image)))
      .catch(() => setSlides([]));
    return () => controller.abort();
  }, []);

  const [timeLeft, setTimeLeft] = useState({
    d: 11,
    h: 0,
    m: 36,
    s: 9,
  });

  useEffect(() => {
    const target = Date.now() + TARGET_SECONDS * 1000;
    const tick = () => setTimeLeft(getTimeLeft(target));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Eid-Al-Adha Offer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enjoy limited-time offer on this holy festival.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <span className="text-xs font-medium text-muted-foreground">Offer ends in</span>
            <Badge className="h-auto rounded-full bg-primary px-4 py-2 text-sm font-bold text-white tabular-nums shadow-md shadow-primary/30 hover:bg-primary">
              {timeLeft.d}d : {pad(timeLeft.h)}h : {pad(timeLeft.m)}m : {pad(timeLeft.s)}s
            </Badge>
          </div>
        </div>

        {/* Promotional slides from the portal. */}
        {slides.length > 0 && (
          <div className="scrollbar-hide mb-8 flex gap-4 overflow-x-auto pb-2">
            {slides.map((slide) => {
              const card = (
                <div className="relative h-44 w-[320px] shrink-0 overflow-hidden rounded-2xl bg-gray-200 sm:w-[420px]">
                  <Image
                    src={asset(slide.image ?? '')}
                    alt={slide.title ?? 'Offer'}
                    fill
                    sizes="420px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                    <p className="text-lg font-bold leading-tight">{slide.title}</p>
                    {slide.subTitle && (
                      <p className="mt-1 text-sm text-white/85">{slide.subTitle}</p>
                    )}
                  </div>
                </div>
              );
              return slide.link ? (
                <Link key={slide.id} href={slide.link} className="shrink-0">
                  {card}
                </Link>
              ) : (
                <div key={slide.id}>{card}</div>
              );
            })}
          </div>
        )}

        {/* Services Grid — from the API, so the cards carry real service ids
            (and CDN imagery) and can actually be booked. */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {services.map((service) => (
            <ServiceCard
              key={service.serviceId}
              serviceId={service.serviceId}
              title={service.title}
              image={service.image}
              rating={service.rating}
              reviewCount={service.reviewCount}
              price={service.price}
              priceUnit={service.priceUnit}
              isBestSeller={service.isTrending}
              subServices={service.packages.map((p) => ({
                id: p.priceId,
                priceId: p.priceId,
                name: p.name,
                price: p.price,
              }))}
              showDetails={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
