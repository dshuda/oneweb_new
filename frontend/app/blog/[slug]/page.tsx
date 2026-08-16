import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { FiArrowLeft, FiArrowRight, FiCalendar, FiUser } from 'react-icons/fi';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface BlogDetail {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  content: string | null;
  appContent: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
  createdAt: string | null;
}

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
    image: '/banner_appliance_repair.png',
    createdAt: '2026-08-12T12:52:23.083103Z',
  },
  {
    id: 4,
    title: 'DIY Plumbing Fixes You Should Know',
    slug: 'diy-plumbing-fixes',
    image: '/banner_appliance_repair.png',
    createdAt: '2026-08-09T12:52:23.083103Z',
  },
  {
    id: 1,
    title: 'Top 5 AC Maintenance Tips for Summer',
    slug: 'ac-maintenance-tips',
    image: '/banner_appliance_repair.png',
    createdAt: '2026-08-04T12:52:23.083076Z',
  },
  {
    id: 2,
    title: 'Why Deep Cleaning is Essential Every 6 Months',
    slug: 'deep-cleaning-essential',
    image: '/banner_appliance_repair.png',
    createdAt: '2026-07-30T12:52:23.083102Z',
  },
  {
    id: 3,
    title: 'Signs Your Home Electrical System Needs an Upgrade',
    slug: 'electrical-system-upgrade',
    image: '/banner_appliance_repair.png',
    createdAt: '2026-07-25T12:52:23.083102Z',
  },
];

import { BASE_URL } from '@/lib/api';

async function fetchBlogBySlug(slug: string): Promise<BlogDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/blogs/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch blog detail from API:', error);
  }
  return null;
}

async function fetchSuggestedBlogs(currentSlug: string): Promise<BlogItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/blogs`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const items: BlogItem[] = data.items || [];
      const filtered = items.filter((b) => b.slug !== currentSlug);
      if (filtered.length > 0) {
        return filtered.slice(0, 5);
      }
    }
  } catch (error) {
    console.error('Failed to fetch suggested blogs from API:', error);
  }
  return fallbackBlogs.filter((b) => b.slug !== currentSlug).slice(0, 5);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await fetchBlogBySlug(slug);

  if (!blog) {
    return { title: 'Blog - One Tap Service' };
  }

  return {
    title: `${blog.title} - One Tap Service`,
    description: blog.metaDescription || blog.content?.slice(0, 150) || blog.title,
  };
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const [blog, suggestedBlogs] = await Promise.all([
    fetchBlogBySlug(slug),
    fetchSuggestedBlogs(slug),
  ]);

  if (!blog) {
    notFound();
  }

  const dateStr = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <FiArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Article (Left 8 Cols) */}
          <article className="lg:col-span-8 min-w-0">
            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
              {blog.title}
            </h1>

            {/* Meta Bar */}
            <div className="mt-6 flex items-center gap-6 border-y border-border/60 py-3.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FiUser size={15} className="text-primary" />
                <span>Admin</span>
              </span>
              {dateStr && (
                <span className="inline-flex items-center gap-1.5">
                  <FiCalendar size={15} className="text-primary" />
                  <span>{dateStr}</span>
                </span>
              )}
            </div>

            {/* Featured Image */}
            <div className="my-8 overflow-hidden rounded-2xl bg-gray-100 shadow-sm border border-border/60">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={blog.image || '/banner_appliance_repair.png'}
                  alt={blog.title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            {/* Content from API */}
            <div className="prose prose-slate max-w-none text-base sm:text-lg leading-relaxed text-foreground/90">
              {blog.content ? (
                <div className="whitespace-pre-line">{blog.content}</div>
              ) : (
                <p className="text-muted-foreground">No content available for this blog post.</p>
              )}
            </div>
          </article>

          {/* Right Sidebar - Suggested Blogs (4 Cols) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
            {/* Service Promo Widget */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <h3 className="font-bold text-slate-900 text-base">Need Expert Home Service?</h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Book verified professionals for AC repair, deep cleaning, electrical work, and more with warranty.
                </p>
                <Link
                  href="/services"
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90"
                >
                  <span>Explore All Services</span>
                  <FiArrowRight size={13} />
                </Link>
              </div>
              
              {/* Suggested Blogs Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>Suggested Articles</span>
                  <span className="text-xs font-medium text-muted-foreground">{suggestedBlogs.length} articles</span>
                </h2>

                <div className="divide-y divide-slate-100">
                  {suggestedBlogs.map((item) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.slug}`}
                      prefetch={false}
                      scroll={true}
                      className="group flex items-start gap-3 py-3.5 no-underline text-inherit cursor-pointer transition-colors"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                        <Image
                          src={item.image || '/banner_appliance_repair.png'}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-center min-w-0">
                        {item.createdAt && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <FiCalendar size={11} className="text-primary/70" />
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        <h3 className="line-clamp-2 text-xs font-bold text-slate-800 transition-colors group-hover:text-primary leading-snug mt-1">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
