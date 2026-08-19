import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FiUsers, FiArrowRight } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Partner with Us - One Tap Service",
  description:
    "Partner with One Tap Service. Grow your business with our platform — partnership opportunities coming soon.",
};

export default function PartnerWithUsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">Partner with Us</span>
        </nav>

        {/* Coming Soon Card */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FiUsers size={36} className="text-primary" />
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Partner with Us
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            Grow your business by partnering with One Tap Service. Reach
            thousands of customers and expand your service offerings.
          </p>

          <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-8">
            <h2 className="text-xl font-bold text-foreground">
              🚀 Coming Soon
            </h2>
            <p className="mt-2 text-muted-foreground">
              Our partnership program is in the works. We&apos;re creating
              exciting opportunities for service providers and businesses to
              grow with us.
            </p>

            <Link
              href="/contact-us"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Get in Touch
              <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
