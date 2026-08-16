'use client';

import Link from 'next/link';
import ServiceCard from './ServiceCard';
import { trendingServices } from '@/app/data/services';

export default function TrendingServices() {
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
            href="#"
            className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            View All →
          </Link>
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
