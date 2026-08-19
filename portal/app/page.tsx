'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ServiceCard from '@/components/ServiceCard';
import Navbar from '@/components/Navbar';
import BannerSearchSection from '@/components/home/bannerSearch';
import { PromotionItem, Service, ServiceCategory, Slider } from '@/types/home/response';
import FeaturesSection from '@/components/home/FeaturesSection';
import ServicesCategories from '@/components/home/ServicesCategories';
import BannerSlider from '@/components/home/slider';
import PromotionalSlider from '@/components/home/promotionalSlider';
import { MoveRight } from 'lucide-react';
import AppDownloadBanner from '@/components/home/appDownloadBanner';
import PublicFooter from '@/components/layout/publicFooter';


export default function HomePage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [promotionalSliders, setPromotionalSliders] = useState<PromotionItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [trendingServices, setTrendingServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slidersRes, categoriesRes, servicesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/v1/sliders`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/v1/services/categories`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/v1/services?page=1&pageSize=8`),
        ]);

        if (slidersRes.ok) {
          const data = await slidersRes.json();
          setSliders(data || []);
          setPromotionalSliders(data || []);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          var newdata = [{ id: 0, name: "All Categories", icon: "✨" },
          ...data]
          setCategories(newdata || []);
        }

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setTrendingServices(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  return (
    <div>
      <Navbar />
      <BannerSearchSection CATEGORIES={categories} />


      {/* Service Categories */}
      <ServicesCategories categories={categories} />

      {/* Hero/Banner Slider — sliders come from /api/v1/sliders */}
      {loading ? (
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-gray-500">
          Loading offers…
        </div>
      ) : (
        sliders.length > 0 && <BannerSlider sliders={sliders} />
      )}

      <PromotionalSlider items={promotionalSliders} />

      {/* Features Section */}
      <FeaturesSection />


      {/* Trending Services */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex items-center justify-around mb-8">
            <div className="w-full md:w-8/12">
              <h2 className="text-3xl font-bold text-left">Trending Services</h2>
              <p className="text-gray-600 mb-8">Most booked services on your area this week</p>
            </div>
            <div className="w-full md:w-4/12 text-right">
              <Link href="/services" className="inline-block px-6 py-3 text-[#64399C] transition-colors duration-300">
                View All Services
                <MoveRight className="inline-block ml-2" />
              </Link>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                name={service.name}
                slug={service.slug}
                bannerImage={service.bannerImage}
                initialPrice={service.initialPrice}
                isTrending={service.isTrending}
              />
            ))}
          </div>
        </div>
      </section>


      {/* How It Works */}
      {/* <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#64399C] text-white rounded-full flex items-center justify-center text-3xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Browse Services</h3>
            <p className="text-gray-600">Explore our wide range of professional services</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#64399C] text-white rounded-full flex items-center justify-center text-3xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Book a Service</h3>
            <p className="text-gray-600">Choose your preferred time and book instantly</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#64399C] text-white rounded-full flex items-center justify-center text-3xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Get It Done</h3>
            <p className="text-gray-600">Our professionals will take care of the rest</p>
          </div>
        </div>
      </section> */}

      <AppDownloadBanner />

      <PublicFooter />

    </div>
  );
}
