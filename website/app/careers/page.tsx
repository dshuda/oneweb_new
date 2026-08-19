import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FiBriefcase, FiArrowRight } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Careers - One Tap Service",
  description:
    "Join the One Tap Service team. We're building the future of home services — careers coming soon.",
};

export default function CareersPage() {
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
          <span className="font-medium text-foreground">Careers</span>
        </nav>

        {/* Coming Soon Card */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <FiBriefcase size={36} className="text-primary" />
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Careers
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            We&apos;re building something exciting. Join the One Tap Service team
            and help us redefine home services for millions of customers.
          </p>

          <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-8">
            <h2 className="text-xl font-bold text-foreground">
              🚀 Coming Soon
            </h2>
            <p className="mt-2 text-muted-foreground">
              We&apos;re working on our careers page. Stay tuned for exciting
              job opportunities and to learn what it&apos;s like to work at One
              Tap Service.
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
