'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCalendar, FiClock } from 'react-icons/fi';
import { asset } from '@/app/lib/assets';

export interface BlogItem {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  createdAt: string;
  category?: string;
  readTime?: string;
}

const fallbackImages: Record<string, string> = {
  'ac-maintenance-tips': '/banner_appliance_repair.png',
  'deep-cleaning-essential': '/service-banners/banner_cleaning.png',
  'electrical-system-upgrade': '/service-banners/banner_electrical_checkup.png',
  'diy-plumbing-fixes': '/banner_hero.png',
  'moving-homes-guide': '/service-banners/banner_painting.png',
};

const defaultFallbackBlogs: BlogItem[] = [
  {
    id: 1,
    title: 'Top 5 AC Maintenance Tips for Summer',
    slug: 'ac-maintenance-tips',
    image: '/banner_appliance_repair.png',
    createdAt: '2026-08-09T03:51:51.243Z',
    category: 'Appliance Care',
    readTime: '3 min read',
  },
  {
    id: 2,
    title: 'Why Deep Cleaning is Essential Every 6 Months',
    slug: 'deep-cleaning-essential',
    image: '/service-banners/banner_cleaning.png',
    createdAt: '2026-08-04T03:51:51.243Z',
    category: 'Home Cleaning',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'Signs Your Home Electrical System Needs an Upgrade',
    slug: 'electrical-system-upgrade',
    image: '/service-banners/banner_electrical_checkup.png',
    createdAt: '2026-07-30T03:51:51.243Z',
    category: 'Electrical',
    readTime: '5 min read',
  },
  {
    id: 4,
    title: 'DIY Plumbing Fixes You Should Know Before Calling a Pro',
    slug: 'diy-plumbing-fixes',
    image: '/banner_hero.png',
    createdAt: '2026-08-14T03:51:51.243Z',
    category: 'Plumbing',
    readTime: '4 min read',
  },
];

export default function BlogSection() {
  const [blogs, setBlogs] = useState<BlogItem[]>(defaultFallbackBlogs);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102';
    fetch(`${apiUrl}/api/v1/blogs?page=1&pageSize=4`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          const mapped = data.items.map((item: any) => ({
            ...item,
            image: item.image || fallbackImages[item.slug] || '/banner_appliance_repair.png',
            category: item.category || 'Home Services',
            readTime: '4 min read',
          }));
          setBlogs(mapped);
        }
      })
      .catch(() => {
        // Keep fallback blogs on error
      });
  }, []);

  return (
    <section className="bg-slate-50/70 py-12 sm:py-16 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
              <span>💡 Useful Tips & Guides</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Latest Blog &amp; Articles
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Expert tips, home maintenance guides, and lifestyle updates.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            View All Articles
            <FiArrowRight size={16} />
          </Link>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="group flex flex-col no-underline text-inherit"
            >
              <article className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/80 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-lg">
                {/* Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={asset(blog.image || fallbackImages[blog.slug] || '/banner_appliance_repair.png')}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {blog.category || 'Home Services'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    {/* Meta info */}
                    <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {blog.createdAt && (
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} className="text-primary" />
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FiClock size={12} />
                        {blog.readTime || '4 min read'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary leading-snug">
                      {blog.title}
                    </h3>
                  </div>

                  {/* Action Link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      Read Details
                      <FiArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
