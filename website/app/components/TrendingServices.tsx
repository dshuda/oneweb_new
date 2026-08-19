'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ServiceCard from './ServiceCard';
import { fetchTrendingServices, type CatalogService } from '@/app/lib/catalog';

export default function TrendingServices() {
  const [services, setServices] = useState<CatalogService[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTrendingServices(5, controller.signal)
      .then(setServices)
      .catch(() => setServices([]));
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Trending Services</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Most booked services in your area this week.
            </p>
          </div>
          <Link
            href="/services"
            className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            View All →
          </Link>
        </div>

        {/* Services Grid */}
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
