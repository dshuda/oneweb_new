'use client';

import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Profile = dynamic(() => import("./Profile"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex min-h-[500px] max-w-4xl items-center justify-center px-4 pb-20 pt-32 sm:px-6 lg:pt-36">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Profile />
      <Footer />
    </main>
  );
}
