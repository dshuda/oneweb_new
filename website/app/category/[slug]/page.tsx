import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { getCategoryDetailsBySlug } from "@/app/data/services";
import CategoryClient from "./CategoryClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryDetailsBySlug(slug);
  if (!category) {
    return { title: "Category - One Tap Service" };
  }
  return {
    title: `${category.name} - One Tap Service`,
    description: category.heroSubtitle,
  };
}

export default async function CategoryDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryDetailsBySlug(slug);
  if (!category) notFound();

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CategoryClient slug={category.slug} />
      <Footer />
    </main>
  );
}
