'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ServiceCard from './ServiceCard';
import { trendingServices as fallbackServices, ServiceData } from '@/app/data/services';
import api from '@/lib/api';

export default function TrendingServices() {
  const [services, setServices] = useState<ServiceData[]>(fallbackServices);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/api/v1/services?pageSize=10');
        const data = res.data;
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          const mapped: ServiceData[] = items.map((s: any) => ({
            id: s.id,
            title: s.name || s.title,
            image: s.bannerImage || '/service-banners/banner_cleaning.png',
            rating: s.rating || 4.9,
            reviewCount: s.reviewCount || 120,
            price: s.initialPrice || 499,
            isBestSeller: s.isTrending,
          }));
          setServices(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchServices();
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
            <ServiceCard key={service.id} {...service} showDetails={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
