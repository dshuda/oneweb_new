'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CategoryIcon from '@/app/components/CategoryIcon';
import { fetchCategories, type CatalogCategory } from '@/app/lib/catalog';

/** Category grid, sourced from the API so new categories appear without a deploy. */
export default function BrowseCategories() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading categories…
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Services are unavailable right now. Please try again shortly.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/5 transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
            <CategoryIcon
              icon={category.icon}
              name={category.name}
              size={28}
              className="h-9 w-9"
            />
          </span>
          <span className="text-sm font-semibold leading-snug text-foreground">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
