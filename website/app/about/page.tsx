import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FiAward,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiShield,
  FiUsers,
} from "react-icons/fi";

export const metadata: Metadata = {
  title: "About Us - One Tap Service",
  description:
    "Learn about One Tap Service — our mission, values, and the people making everyday home services faster, easier, and more reliable.",
};

const values = [
  {
    icon: FiShield,
    title: "Trust & Safety",
    description:
      "Every professional is background-checked, verified, and trained so you can invite them into your home with confidence.",
  },
  {
    icon: FiClock,
    title: "Reliability",
    description:
      "We show up on time, every time. Your schedule matters, and we respect it with punctual, dependable service.",
  },
  {
    icon: FiAward,
    title: "Quality Guaranteed",
    description:
      "Workmanship backed by a service warranty and a dedicated support team that stands behind every job.",
  },
  {
    icon: FiHeart,
    title: "Customer First",
    description:
      "Transparent pricing, easy booking, and real-time tracking — built around making your life simpler.",
  },
];

const stats = [
  { value: "10k+", label: "Happy Users" },
  { value: "500+", label: "Verified Professionals" },
  { value: "25+", label: "Service Categories" },
  { value: "4.8★", label: "Average Rating" },
];

export default function AboutPage() {
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
          <span className="font-medium text-foreground">About Us</span>
        </nav>

        {/* Heading */}
        <div className="mb-14 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Making everyday home services <span className="text-primary">effortless</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            One Tap Service was founded on a simple idea: getting quality home
            services should be as easy as a single tap. From deep cleaning to
            appliance repair, shifting, and security, we connect you with
            verified professionals who get the job done right.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/80 bg-white p-6 text-center shadow-sm"
            >
              <p className="text-2xl font-extrabold text-primary sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="mb-14 overflow-hidden rounded-3xl bg-gradient-to-r from-[#5e3a8a] via-[#7b52b3] to-[#a78bfa] px-6 py-12 sm:px-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              <FiUsers size={14} />
              Our Mission
            </span>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              A better way to care for your home and lifestyle.
            </h2>
            <p className="text-base leading-relaxed text-white/90 sm:text-lg">
              We believe expert help should be accessible to everyone. That&apos;s
              why we vet, train, and support a network of skilled professionals
              — and make booking them transparent, affordable, and delightfully
              simple.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => {
            const IconComponent = value.icon;
            return (
              <div
                key={value.title}
                className="rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <IconComponent size={26} className="text-primary" />
                </span>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-12">
          <FiCheckCircle size={32} className="mx-auto mb-4 text-primary" />
          <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
            Ready to experience the difference?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
            Explore our services and book a verified professional in just a few
            taps.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Browse Services
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
