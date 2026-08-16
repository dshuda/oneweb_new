import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { serviceCategories as fallbackCategories } from "../data/services";

export const metadata: Metadata = {
  title: "Browse Services - One Tap Service",
  description:
    "Explore all service categories — cleaning, appliance repair, shifting, plumbing, security, and more. One tap away.",
};

async function getCategories() {
  try {
    const backendUrl = process.env.INTERNAL_API_URL || (typeof window === 'undefined' ? 'http://127.0.0.1:5102' : '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${backendUrl}/api/v1/services/categories`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((cat: any) => {
          const nameParts = (cat.name || '').split(' ');
          const firstName = nameParts[0] || cat.name;
          const subName = nameParts.slice(1).join(' ') || 'Service';
          return {
            id: cat.id,
            name: firstName,
            sub: subName,
            slug: cat.slug || firstName.toLowerCase(),
            icon: cat.serviceIcon || '/service-icons/icon_cleaning.svg',
          };
        });
      }
    }
  } catch (e) {
    // Fallback on error
  }
  return fallbackCategories;
}

export default async function ServicesPage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">Browse Services</span>
        </nav>

        {/* Heading */}
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Browse Categories
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Explore all the services we offer — from home cleaning and appliance
            repair to shifting, plumbing, and gadget repair. Find what you need,
            one tap away.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category: any) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/80 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/5 transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                {typeof category.icon === "string" ? (
                  <Image
                    src={category.icon}
                    alt={category.name}
                    width={42}
                    height={42}
                    className="h-9 w-9 object-contain"
                  />
                ) : (
                  <span className="text-primary font-bold text-xl">★</span>
                )}
              </span>
              <span className="text-sm font-semibold leading-snug text-foreground">
                {category.name}
                <br />
                {category.sub}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
