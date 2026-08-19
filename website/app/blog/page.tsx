"use client";

import { asset } from "@/app/lib/assets";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowRight, FiCalendar, FiClock, FiSearch } from "react-icons/fi";
import Footer from "../components/Footer";
import Header from "../components/Header";

interface BlogItem {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  createdAt: string;
  category?: string;
  readTime?: string;
}

const fallbackImages: Record<string, string> = {
  "ac-maintenance-tips": "/banner_appliance_repair.png",
  "deep-cleaning-essential": "/service-banners/banner_cleaning.png",
  "electrical-system-upgrade": "/service-banners/banner_electrical_checkup.png",
  "diy-plumbing-fixes": "/banner_hero.png",
  "moving-homes-guide": "/service-banners/banner_painting.png",
};

const defaultBlogs: BlogItem[] = [
  {
    id: 1,
    title: "Top 5 AC Maintenance Tips for Summer",
    slug: "ac-maintenance-tips",
    image: "/banner_appliance_repair.png",
    createdAt: "2026-08-09T03:51:51.243Z",
    category: "Appliance Care",
    readTime: "3 min read",
  },
  {
    id: 2,
    title: "Why Deep Cleaning is Essential Every 6 Months",
    slug: "deep-cleaning-essential",
    image: "/service-banners/banner_cleaning.png",
    createdAt: "2026-08-04T03:51:51.243Z",
    category: "Home Cleaning",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Signs Your Home Electrical System Needs an Upgrade",
    slug: "electrical-system-upgrade",
    image: "/service-banners/banner_electrical_checkup.png",
    createdAt: "2026-07-30T03:51:51.243Z",
    category: "Electrical",
    readTime: "5 min read",
  },
  {
    id: 4,
    title: "DIY Plumbing Fixes You Should Know Before Calling a Pro",
    slug: "diy-plumbing-fixes",
    image: "/banner_hero.png",
    createdAt: "2026-08-14T03:51:51.243Z",
    category: "Plumbing",
    readTime: "4 min read",
  },
  {
    id: 5,
    title: "The Ultimate Guide to Moving Homes Without Stress",
    slug: "moving-homes-guide",
    image: "/service-banners/banner_painting.png",
    createdAt: "2026-08-17T03:51:51.243Z",
    category: "Shifting & Moving",
    readTime: "6 min read",
  },
];

export default function BlogIndexPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>(defaultBlogs);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5102";
    fetch(`${apiUrl}/api/v1/blogs?page=1&pageSize=20`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.items && Array.isArray(d.items) && d.items.length > 0) {
          const mapped = d.items.map((item: any) => ({
            ...item,
            image:
              item.image ||
              fallbackImages[item.slug] ||
              "/banner_appliance_repair.png",
            category: item.category || "Home Services",
            readTime: "4 min read",
          }));
          setBlogs(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    "All",
    "Appliance Care",
    "Home Cleaning",
    "Electrical",
    "Plumbing",
    "Shifting & Moving",
  ];

  const filtered = blogs.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <span>📖 Knowledge &amp; Guides</span>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              OneTap Articles &amp; Insights
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Practical guides, DIY maintenance advice, and home service trends
              curated by professional technicians.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-6 max-w-md relative">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === c
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="group flex flex-col no-underline text-inherit"
              >
                <article className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200/80 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl">
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={asset(
                        blog.image ||
                          fallbackImages[blog.slug] ||
                          "/banner_appliance_repair.png",
                      )}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      {blog.category || "Home Services"}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {blog.createdAt && (
                          <span className="flex items-center gap-1">
                            <FiCalendar size={13} className="text-primary" />
                            {new Date(blog.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FiClock size={13} />
                          {blog.readTime || "4 min read"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary leading-snug">
                        {blog.title}
                      </h3>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        Read Full Story
                        <FiArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-base">
                No articles found matching &quot;{search}&quot;
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}