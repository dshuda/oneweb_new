import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';

interface BlogItem {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  createdAt: string;
}

const fallbackBlogs: BlogItem[] = [
  {
    id: 5,
    title: 'The Ultimate Guide to Moving Homes',
    slug: 'moving-homes-guide',
    image: '/banner_appliance_repair.webp',
    createdAt: '2026-08-12T12:52:23.083103Z',
  },
  {
    id: 4,
    title: 'DIY Plumbing Fixes You Should Know',
    slug: 'diy-plumbing-fixes',
    image: '/banner_appliance_repair.webp',
    createdAt: '2026-08-09T12:52:23.083103Z',
  },
  {
    id: 1,
    title: 'Top 5 AC Maintenance Tips for Summer',
    slug: 'ac-maintenance-tips',
    image: '/banner_appliance_repair.webp',
    createdAt: '2026-08-04T12:52:23.083076Z',
  },
  {
    id: 2,
    title: 'Why Deep Cleaning is Essential Every 6 Months',
    slug: 'deep-cleaning-essential',
    image: '/banner_appliance_repair.webp',
    createdAt: '2026-07-30T12:52:23.083102Z',
  },
];

import { BASE_URL } from '@/lib/api';

async function getBlogs(): Promise<BlogItem[]> {
  try {
    const backendUrl = process.env.INTERNAL_API_URL || (typeof window === 'undefined' ? 'http://127.0.0.1:5102' : '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${backendUrl}/api/v1/blogs`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.slice(0, 4);
      }
    }
  } catch (error) {
    // Fast fallback without blocking page render
  }
  return fallbackBlogs.slice(0, 4);
}

export default async function BlogSection() {
  const blogs = await getBlogs();
  const displayBlogs = blogs.slice(0, 4);

  return (
    <section className="bg-slate-50/70 py-12 sm:py-16 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Latest Blog & Articles
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Helpful home service tips and updates.
            </p>
          </div>
        </div>

        {/* Blog Cards Grid - 4 Columns */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayBlogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="group flex flex-col no-underline text-inherit cursor-pointer"
            >
              <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg cursor-pointer">
                {/* Thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100 sm:h-44">
                  <Image
                    src={blog.image || '/banner_appliance_repair.png'}
                    alt={blog.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    {/* Date */}
                    {blog.createdAt && (
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FiCalendar size={13} className="text-primary/70" />
                        <span>
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary leading-snug">
                      {blog.title}
                    </h3>
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      Read Details
                      <FiArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
