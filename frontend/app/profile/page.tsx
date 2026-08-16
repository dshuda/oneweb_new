import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Profile from "./Profile";

export const metadata: Metadata = {
  title: "My Profile - One Tap Service",
  description:
    "View your One Tap profile, phone number, and booking summary.",
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Profile />
      <Footer />
    </main>
  );
}
