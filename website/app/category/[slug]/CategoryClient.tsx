"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryHero from "@/app/components/CategoryHero";
import CategorySidebar from "@/app/components/CategorySidebar";
import ServiceCard from "@/app/components/ServiceCard";
import {
  fetchCategories,
  fetchCategoryServices,
  type CatalogCategory,
  type CatalogSubCategory,
} from "@/app/lib/catalog";

interface CategoryClientProps {
  slug: string;
}

export default function CategoryClient({ slug: initialSlug }: CategoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // The active category is kept in state so switching categories swaps the
  // content IN PLACE (no full page reload / scroll-to-top jump).
  const [slug, setSlug] = useState(initialSlug);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [groups, setGroups] = useState<CatalogSubCategory[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const category = categories.find((c) => c.slug === slug) ?? null;

  // Category list (with its sub-category tabs) comes from the API.
  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => setCategories([]));
    return () => controller.abort();
  }, []);

  // Services for whichever category is active.
  useEffect(() => {
    if (!category) return;
    const controller = new AbortController();
    setLoading(true);
    fetchCategoryServices(category, controller.signal)
      .then((next) => {
        setGroups(next);
        setActiveId(next[0]?.id ?? null);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [category]);

  // Keep the in-place state in sync with the URL (browser back/forward, etc.).
  useEffect(() => {
    const urlSlug = pathname.split("/").findLast(Boolean) ?? "";
    if (urlSlug && urlSlug !== slug) setSlug(urlSlug);
  }, [pathname, slug]);

  const handleCategoryChange = (newSlug: string) => {
    if (newSlug === slug) return;
    setSlug(newSlug);
    // Update the URL without navigating away — no reload, no scroll jump.
    router.replace(`/category/${newSlug}`, { scroll: false });
  };

  const handleTabClick = (id: number) => {
    setActiveId(id);
    document
      .getElementById("category-services")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 text-center text-muted-foreground">
        {categories.length === 0 ? "Loading services…" : "Category not found."}
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.id === activeId) ?? groups.at(0) ?? null;

  return (
    <>
      {/* Hero */}
      <div className="relative">
        <CategoryHero
          name={category.name}
          title={category.heroTitle ?? category.name}
          titleAccent=""
          subtitle={
            category.heroSubtitle ??
            `Browse trusted ${category.name.toLowerCase()} services, one tap away.`
          }
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
          {activeGroup && (
            <>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{activeGroup.name}</span>
            </>
          )}
        </nav>

        {/* Category sidebar + services (two-column on desktop) */}
        <div className="mt-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Left category nav */}
          <CategorySidebar
            activeSlug={category.slug}
            categories={categories.map((c) => ({
              slug: c.slug,
              name: c.name,
              icon: c.icon,
            }))}
            onNavigate={handleCategoryChange}
          />

          <div>
            {/* Filter tabs */}
            <div
              id="category-services"
              className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scroll-mt-28 sm:mx-0 sm:px-0"
            >
              {groups.map((group) => {
                const isActive = group.id === activeGroup?.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleTabClick(group.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {group.name}
                  </button>
                );
              })}
            </div>

            {/* Heading + count */}
            <div className="mb-3 mt-9 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                {activeGroup?.name ?? category.name}
              </h2>
              {activeGroup && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {activeGroup.services.length}{" "}
                  {activeGroup.services.length === 1 ? "Service" : "Services"}
                </span>
              )}
            </div>
            <p className="mb-8 text-sm text-muted-foreground">
              Hand-picked {category.name.toLowerCase()} services — quality
              assured, one tap away.
            </p>

            {/* Services grid */}
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading services…
              </p>
            ) : !activeGroup ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No services are available in this category yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {activeGroup.services.map((service) => (
                  <ServiceCard
                    key={service.serviceId}
                    serviceId={service.serviceId}
                    title={service.title}
                    image={service.image}
                    rating={service.rating}
                    reviewCount={service.reviewCount}
                    price={service.price}
                    priceUnit={service.priceUnit}
                    serviceCount={service.packages.length || undefined}
                    subServices={service.packages.map((p) => ({
                      id: p.priceId,
                      priceId: p.priceId,
                      name: p.name,
                      price: p.price,
                    }))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
