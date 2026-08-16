'use client';

import { useEffect, useState } from 'react';
import ServiceCard from './ServiceCard';
import { Badge } from '@/components/ui/badge';
import { trendingServices } from '@/app/data/services';

const TARGET_SECONDS = 11 * 24 * 3600 + 0 * 3600 + 36 * 60 + 9; // 11d : 0h : 36m : 09s

function getTimeLeft(target: number) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function EidOffer() {
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

  const pad = (n: number) => String(n).padStart(2, '0');

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

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {trendingServices.map((service) => (
            <ServiceCard key={service.id} {...service} showDetails={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
