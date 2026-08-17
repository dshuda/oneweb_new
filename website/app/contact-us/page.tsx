import type { Metadata } from "next";
import Link from "next/link";
import {
  FiClock,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactForm from "../components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us - One Tap Service",
  description:
    "Get in touch with One Tap Service — support, bookings, partnerships, or general questions. We respond within 24 hours.",
};

const contactInfo = [
  {
    icon: FiMapPin,
    title: "Visit Us",
    lines: ["66 Kalabagan", "Dhanmondi, Dhaka"],
  },
  {
    icon: FiPhone,
    title: "Call Us",
    lines: ["+880 1700-000000", "+880 1700-000001"],
  },
  {
    icon: FiMail,
    title: "Email Us",
    lines: ["support@onetapservice.com", "hello@onetapservice.com"],
  },
  {
    icon: FiClock,
    title: "Working Hours",
    lines: ["Sat – Thu: 9:00 AM – 9:00 PM", "Friday: 3:00 PM – 9:00 PM"],
  },
];

export default function ContactPage() {
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
          <span className="font-medium text-foreground">Contact Us</span>
        </nav>

        {/* Heading */}
        <div className="mb-12 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            Questions about a service, a booking, or partnership? Send us a
            message and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-sm sm:p-8">
              <ContactForm />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 lg:col-span-2">
            {contactInfo.map((info) => {
              const IconComponent = info.icon;
              return (
                <div
                  key={info.title}
                  className="flex items-start gap-4 rounded-2xl border border-border/80 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <IconComponent size={22} className="text-primary" />
                  </span>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">
                      {info.title}
                    </h3>
                    {info.lines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
