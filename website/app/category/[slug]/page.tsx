import type { Metadata } from "next";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import CategoryClient from "./CategoryClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * The catalogue lives in the API, so the slug is not validated here — the
 * client fetches categories and renders a "not found" state itself. That keeps
 * this route working for any category the backend adds, with no redeploy.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const readable = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    title: `${readable} - One Tap Service`,
    description: `Book trusted ${readable.toLowerCase()} services with One Tap Service.`,
  };
}

export default async function CategoryDetailsPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CategoryClient slug={slug} />
      <Footer />
    </main>
  );
}
