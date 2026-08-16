"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryHero from "@/app/components/CategoryHero";
import CategorySidebar from "@/app/components/CategorySidebar";
import ServiceCard from "@/app/components/ServiceCard";
import { getCategoryDetailsBySlug } from "@/app/data/services";

interface CategoryClientProps {
  slug: string;
}

export default function CategoryClient({ slug: initialSlug }: CategoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // The active category is kept in state so switching categories swaps the
  // content IN PLACE (no full page reload / scroll-to-top jump).
  const [slug, setSlug] = useState(initialSlug);
  const [activeId, setActiveId] = useState(() => {
    const cat = getCategoryDetailsBySlug(initialSlug);
    return cat?.subCategories[0]?.id ?? 0;
  });

  const category = getCategoryDetailsBySlug(slug);

  // Switch to another category in place — the single source of truth used by
  // both the sidebar handler and the URL-sync effect.
  const applySlug = (nextSlug: string) => {
    const next = getCategoryDetailsBySlug(nextSlug);
    if (!next) return;
    setSlug(nextSlug);
    setActiveId(next.subCategories[0]?.id ?? 0);
  };

  // Keep the in-place state in sync with the URL (browser back/forward, etc.).
  useEffect(() => {
    const urlSlug = pathname.split("/").filter(Boolean).pop() ?? "";
    if (urlSlug && urlSlug !== slug) {
      applySlug(urlSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!category) return null;

  const activeSub =
    category.subCategories.find((sub) => sub.id === activeId) ??
    category.subCategories[0];

  const handleCategoryChange = (newSlug: string) => {
    if (newSlug === slug) return;
    applySlug(newSlug);
    // Update the URL without navigating away — no reload, no scroll jump.
    router.replace(`/category/${newSlug}`, { scroll: false });
  };

  const handleTabClick = (id: number) => {
    setActiveId(id);
    document
      .getElementById("category-services")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Hero */}
      <div className="relative">
        <CategoryHero
          name={category.name}
          title={category.heroTitle}
          titleAccent={category.heroTitleAccent}
          subtitle={category.heroSubtitle}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/category/${category.slug}`}
            className="transition-colors hover:text-primary"
          >
            {category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">{activeSub.name}</span>
        </nav>

        {/* Category sidebar + services (two-column on desktop) */}
        <div className="mt-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Left category nav */}
          <CategorySidebar
            activeSlug={category.slug}
            onNavigate={handleCategoryChange}
          />

          <div>
            {/* Filter tabs */}
            <div
              id="category-services"
              className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scroll-mt-28 sm:mx-0 sm:px-0"
            >
              {category.subCategories.map((sub) => {
                const isActive = sub.id === activeSub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleTabClick(sub.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <sub.icon size={16} strokeWidth={2.2} />
                    {sub.name}
                  </button>
                );
              })}
            </div>

            {/* Heading + count */}
            <div className="mb-3 mt-9 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                {activeSub.name}
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {activeSub.services.length}{" "}
                {activeSub.services.length === 1 ? "Service" : "Services"}
              </span>
            </div>
            <p className="mb-8 text-sm text-muted-foreground">
              Hand-picked {category.name.toLowerCase()} services — quality
              assured, one tap away.
            </p>

            {/* Services grid */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {activeSub.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  title={service.title}
                  image={service.image}
                  rating={service.rating}
                  reviewCount={service.reviewCount}
                  price={service.price}
                  priceUnit={service.priceUnit}
                  serviceCount={service.serviceCount}
                  subServices={service.subServices}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
