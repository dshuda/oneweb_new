import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BrowseCategories from "./BrowseCategories";

export const metadata: Metadata = {
  title: "Browse Services - One Tap Service",
  description:
    "Explore all service categories — cleaning, appliance repair, shifting, plumbing, security, and more. One tap away.",
};

export default function ServicesPage() {
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

        {/* Categories Grid — loaded from the API */}
        <BrowseCategories />
      </div>

      <Footer />
    </main>
  );
}
