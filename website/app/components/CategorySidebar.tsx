"use client";

import Link from "next/link";
import { FiGrid } from "react-icons/fi";
import CategoryIcon from "./CategoryIcon";

export interface SidebarCategory {
  slug: string;
  name: string;
  icon?: string | null;
}

interface CategorySidebarProps {
  activeSlug: string;
  /** Supplied by the caller, which loads them from the API. */
  categories: SidebarCategory[];
  onNavigate: (slug: string) => void;
}

/**
 * Left-side category navigation shown on category detail pages.
 * - Desktop (lg+): sticky vertical list with a lavender "selected" state.
 * - Mobile: collapses into a horizontally scrollable strip.
 * Clicking a category navigates to its own page, swapping the services shown.
 */
export default function CategorySidebar({
  activeSlug,
  categories,
  onNavigate,
}: CategorySidebarProps) {
  return (
    <aside className="-mx-4 px-4 lg:mx-0 lg:px-0">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-border/70 lg:bg-white lg:p-2 lg:pb-2.5 lg:shadow-sm">
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              onClick={(e) => {
                // Let Cmd/Ctrl/Shift/middle clicks behave normally (new tab).
                if (
                  e.defaultPrevented ||
                  e.metaKey ||
                  e.ctrlKey ||
                  e.shiftKey ||
                  e.button !== 0
                ) {
                  return;
                }
                // Swap the category in place — no full page reload.
                e.preventDefault();
                onNavigate(category.slug);
              }}
              aria-current={isActive ? "page" : undefined}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 lg:w-full ${
                isActive
                  ? "bg-primary/10 ring-1 ring-primary/20"
                  : "hover:bg-primary/5"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ${
                  isActive
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-border bg-background text-foreground group-hover:border-primary/25 group-hover:bg-primary/5 group-hover:text-primary"
                }`}
              >
                <CategoryIcon
                  icon={category.icon}
                  name={category.name}
                  size={20}
                  className="h-5 w-5"
                />
              </span>
              <span className="text-left text-[13px] leading-snug font-semibold whitespace-nowrap text-foreground">
                {category.name}
              </span>
            </Link>
          );
        })}

        {/* All Services — navigates to the browse categories page */}
        <Link
          href="/services"
          className="group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-primary/5 lg:w-full"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary transition-colors group-hover:border-primary/60 group-hover:bg-primary/10">
            <FiGrid size={18} />
          </span>
          <span className="text-left text-[13px] leading-snug font-semibold whitespace-nowrap text-foreground">
            All
            <br />
            <span className="text-muted-foreground">Services</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
