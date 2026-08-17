"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryHero from "@/app/components/CategoryHero";
import CategorySidebar from "@/app/components/CategorySidebar";
import ServiceCard from "@/app/components/ServiceCard";
import { getCategoryDetailsBySlug, CategoryDetails, SubCategory, ServiceItem } from "@/app/data/services";
import { resolveImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";

interface CategoryClientProps {
  slug: string;
}

export default function CategoryClient({ slug: initialSlug }: CategoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [slug, setSlug] = useState(initialSlug);
  const [activeId, setActiveId] = useState<number>(0);
  const [dynamicCategory, setDynamicCategory] = useState<CategoryDetails | null>(null);

  // 1. Fetch live subcategories and images from backend
  useEffect(() => {
    const fetchLiveCategory = async () => {
      try {
        const res = await api.get('/api/v1/services/categories');
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          const matched = data.find((c: any) => 
            (c.slug && c.slug.toLowerCase() === slug.toLowerCase()) ||
            (c.name && c.name.toLowerCase().includes(slug.replace('-', ' ').toLowerCase())) ||
            (slug.toLowerCase().includes((c.name || '').toLowerCase()))
          );

          if (matched && Array.isArray(matched.children) && matched.children.length > 0) {
            const fallback = getCategoryDetailsBySlug(slug);
            const liveSubCategories: SubCategory[] = matched.children.map((child: any, idx: number) => {
              const childImg = resolveImageUrl(child.bannerImage || child.serviceIcon, '/service-banners/banner_cleaning.png');
              
              // Find matching fallback subcategory if available
              const matchedFallbackSub = fallback?.subCategories?.find((fs: any) => 
                (fs.name && fs.name.toLowerCase() === child.name.toLowerCase()) || fs.id === child.id
              );

              const services: ServiceItem[] = (Array.isArray(child.children) && child.children.length > 0)
                ? child.children.map((srv: any) => ({
                    id: srv.id,
                    title: srv.name || child.name,
                    image: resolveImageUrl(srv.bannerImage || srv.serviceIcon || childImg, childImg),
                    rating: 4.9,
                    reviewCount: 120,
                    price: srv.initialPrice || child.initialPrice || 499,
                    priceUnit: '/service',
                    serviceCount: 1,
                  }))
                : (matchedFallbackSub?.services && matchedFallbackSub.services.length > 0)
                  ? matchedFallbackSub.services.map((fs: any) => ({
                      ...fs,
                      // Override default image with real admin-configured subcategory image!
                      image: childImg || fs.image,
                    }))
                  : [{
                      id: child.id,
                      title: child.name,
                      image: childImg,
                      rating: 4.9,
                      reviewCount: 120,
                      price: child.initialPrice || 499,
                      priceUnit: '/service',
                      serviceCount: 1,
                    }];

              return {
                id: child.id || (idx + 1),
                name: child.name,
                icon: matchedFallbackSub?.icon || (() => null),
                services,
              };
            });

            if (liveSubCategories.length > 0) {
              setDynamicCategory({
                id: matched.id,
                name: matched.name,
                slug: matched.slug || slug,
                heroTitle: fallback?.heroTitle || `${matched.name} Services`,
                heroTitleAccent: fallback?.heroTitleAccent || 'Delivered to Your Doorstep',
                heroSubtitle: fallback?.heroSubtitle || `Expert ${matched.name.toLowerCase()} services in Dhaka. Verified professionals, transparent pricing.`,
                subCategories: liveSubCategories,
              });

              setActiveId((prev) => {
                const exists = liveSubCategories.some((s) => s.id === prev);
                return exists ? prev : liveSubCategories[0].id;
              });
              return;
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic category data:', err);
      }
      
      const fb = getCategoryDetailsBySlug(slug);
      setDynamicCategory(fb ?? null);
      if (fb?.subCategories?.[0]) {
        setActiveId(fb.subCategories[0].id);
      }
    };

    fetchLiveCategory();
  }, [slug]);

  const category = dynamicCategory || getCategoryDetailsBySlug(slug);

  const applySlug = (nextSlug: string) => {
    setSlug(nextSlug);
  };

  useEffect(() => {
    const urlSlug = pathname.split("/").filter(Boolean).pop() ?? "";
    if (urlSlug && urlSlug !== slug) {
      applySlug(urlSlug);
    }
  }, [pathname]);

  if (!category) return null;

  const activeSub =
    category.subCategories.find((sub) => sub.id === activeId) ??
    category.subCategories[0];

  const handleCategoryChange = (newSlug: string) => {
    if (newSlug === slug) return;
    applySlug(newSlug);
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
