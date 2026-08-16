import AppPromotion from "./components/AppPromotion";
import BlogSection from "./components/BlogSection";
import EidOffer from "./components/EidOffer";
import FeaturesSection from "./components/FeaturesSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ServiceCategories from "./components/ServiceCategories";
import TrendingServices from "./components/TrendingServices";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative">
        <Header />
        <HeroSection />
      </div>
      <ServiceCategories />
      <TrendingServices />
      <EidOffer />
      <FeaturesSection />
      <AppPromotion />
      <BlogSection />
      <Footer />
    </main>
  );
}
