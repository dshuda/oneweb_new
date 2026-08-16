import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "../data/faq";

export const metadata: Metadata = {
  title: "FAQ - One Tap Service",
  description:
    "Answers to frequently asked questions about booking, pricing, scheduling, refunds, and more from One Tap Service.",
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">FAQ</span>
        </nav>

        {/* Heading */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Everything you need to know about booking, pricing, and our service
            professionals. Can&apos;t find what you&apos;re looking for? Contact us.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion className="space-y-3">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <AccordionTrigger className="px-5 py-4 text-left font-semibold text-foreground hover:text-primary hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA */}
        <div className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-10">
          <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
            Still have questions?
          </h2>
          <p className="mb-6 text-muted-foreground">
            Our support team is happy to help you out.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Contact Us
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
