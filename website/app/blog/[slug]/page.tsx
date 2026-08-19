'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { asset } from '@/app/lib/assets';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiShare2,
  FiChevronRight,
  FiTag,
  FiCheckCircle,
} from 'react-icons/fi';

interface BlogDetail {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  content: string | null;
  appContent?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
  createdAt: string;
}

const fallbackImages: Record<string, string> = {
  'ac-maintenance-tips': '/banner_appliance_repair.png',
  'deep-cleaning-essential': '/service-banners/banner_cleaning.png',
  'electrical-system-upgrade': '/service-banners/banner_electrical_checkup.png',
  'diy-plumbing-fixes': '/banner_hero.png',
  'moving-homes-guide': '/service-banners/banner_painting.png',
};

const blogRichFallbacks: Record<string, { title: string; category: string; contentHtml: string }> = {
  'ac-maintenance-tips': {
    title: 'Top 5 AC Maintenance Tips for Summer',
    category: 'Appliance Care',
    contentHtml: `
      <p class="lead">Summer in Bangladesh brings intense heat and humidity, which means your air conditioning unit will be working around the clock. Proper care not only keeps your room ice cold but also saves on electricity bills and prevents unexpected breakdowns.</p>

      <h2>1. Clean or Replace Air Filters Monthly</h2>
      <p>The most important maintenance task that will ensure the efficiency of your air conditioner is to routinely clean or replace its filters. Clogged, dirty filters block normal airflow and reduce a system's efficiency significantly. In dusty Dhaka environments, wash the reusable mesh filters with lukewarm water every 2 to 3 weeks.</p>

      <h2>2. Keep the Outdoor Condenser Unit Clean</h2>
      <p>Leaves, dirt, and dust can accumulate on the outside of the outdoor unit, blocking airflow through the cooling fins. Ensure there is at least a 2-foot clearance around the condenser and gently hose down dust accumulation.</p>

      <h2>3. Check and Clear the Drain Line</h2>
      <p>A clogged AC condensate drain line can cause water leaks inside your living room or bedroom, damaging walls and carpets. If water stops draining outside or you notice dripping indoors, a professional pipe flushing is recommended.</p>

      <h2>4. Inspect Thermostat Settings and Insulation</h2>
      <p>Setting your thermostat between 24°C to 26°C provides optimal comfort and maximum power savings. Keep doors and heavy curtains closed during peak sunlight hours to reduce thermal load.</p>

      <h2>5. Schedule Professional Master Servicing</h2>
      <p>Before summer hits peak temperature, have an experienced technician inspect refrigerant gas pressure, test electrical connections, and perform high-pressure jet cleaning of both indoor and outdoor units.</p>
    `,
  },
  'deep-cleaning-essential': {
    title: 'Why Deep Cleaning is Essential Every 6 Months',
    category: 'Home Cleaning',
    contentHtml: `
      <p class="lead">Daily sweeping and mopping maintain surface cleanliness, but over time, allergens, dust mites, grease, and bacteria settle into unseen corners, carpets, upholstery, and bathroom grouting.</p>

      <h2>The Difference Between Regular Cleaning and Deep Cleaning</h2>
      <p>While regular cleaning focuses on tidying up visible clutter and surface dust, professional deep cleaning reaches behind large appliances, disinfects kitchen exhausts, sanitizes bathroom tiles, and extracts deep dust from sofa fabrics.</p>

      <h2>Key Health Benefits</h2>
      <ul>
        <li><strong>Reduces Allergies & Asthma:</strong> Removes accumulated dust mites and pet dander from upholstery.</li>
        <li><strong>Eliminates Mold & Bacteria:</strong> High-humidity environments create mold growth in bathrooms and kitchen crevices.</li>
        <li><strong>Prolongs Furniture Life:</strong> Regular shampooing and sanitizing keeps sofas, mattresses, and carpets in pristine shape.</li>
      </ul>
    `,
  },
  'electrical-system-upgrade': {
    title: 'Signs Your Home Electrical System Needs an Upgrade',
    category: 'Electrical',
    contentHtml: `
      <p class="lead">Modern households run dozens of high-wattage electronic devices, from air conditioners and microwave ovens to multiple laptops and washing machines. An outdated electrical panel can be a serious fire hazard.</p>

      <h2>Warning Signs to Watch For</h2>
      <ul>
        <li><strong>Frequent Circuit Breaker Tripping:</strong> If your breaker trips whenever the AC and geyser are turned on together, your system is overloaded.</li>
        <li><strong>Flickering or Dimming Lights:</strong> Noticeable dimming when high-draw appliances start up indicates voltage fluctuations.</li>
        <li><strong>Warm or Discolored Switch Plates:</strong> Any switch or socket that feels warm or shows brown scorch marks requires immediate professional inspection.</li>
        <li><strong>Burning Odor:</strong> Never ignore an acrid burning plastic smell coming from electrical outlets.</li>
      </ul>
    `,
  },
  'diy-plumbing-fixes': {
    title: 'DIY Plumbing Fixes You Should Know Before Calling a Pro',
    category: 'Plumbing',
    contentHtml: `
      <p class="lead">Minor plumbing hiccups like slow drains or dripping faucets happen in every household. Before picking up the phone for a plumber, here are easy DIY tricks that can resolve common issues in minutes.</p>

      <h2>1. Unclogging a Slow Sink with Baking Soda & Vinegar</h2>
      <p>Pour half a cup of baking soda down the drain followed by half a cup of white vinegar. Cover the drain with a plug for 15 minutes, then flush with boiling hot water.</p>

      <h2>2. Stopping a Running Toilet</h2>
      <p>Most running toilet tanks are caused by a worn flapper valve or an incorrectly adjusted float arm. Adjusting the chain length often solves the issue instantly.</p>

      <h2>3. Cleaning Aerators on Low-Pressure Faucets</h2>
      <p>Mineral buildup in the aerator mesh restricts tap water flow. Unscrew the aerator tip, soak it in vinegar, and brush away sediment.</p>
    `,
  },
  'moving-homes-guide': {
    title: 'The Ultimate Guide to Moving Homes Without Stress',
    category: 'Shifting & Moving',
    contentHtml: `
      <p class="lead">Relocating to a new apartment in Dhaka can feel overwhelming. Planning ahead with a structured checklist turns chaos into an organized, smooth transition.</p>

      <h2>4 Weeks Before Moving: Declutter & Categorize</h2>
      <p>Sort through all closets and storage rooms. Donate or sell items you no longer use rather than paying to pack and transport them.</p>

      <h2>2 Weeks Before: Book Professional Movers</h2>
      <p>Ensure reliable packers with furniture dismantling, bubble wrapping, and safe transport trucks are booked in advance.</p>

      <h2>Moving Day Essentials Box</h2>
      <p>Pack a separate clearly labeled box with phone chargers, toiletries, changes of clothes, essential medications, and tools.</p>
    `,
  },
};

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102';

    // Fetch blog details
    fetch(`${apiUrl}/api/v1/blogs/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setBlog(data);
      })
      .catch(() => {
        // Use local fallback
        const fb = blogRichFallbacks[slug];
        if (fb) {
          setBlog({
            id: 99,
            title: fb.title,
            slug,
            image: fallbackImages[slug] || '/banner_appliance_repair.png',
            content: fb.contentHtml,
            createdAt: '2026-08-10T12:00:00Z',
          });
        }
      })
      .finally(() => setLoading(false));

    // Fetch other recent blogs for sidebar
    fetch(`${apiUrl}/api/v1/blogs?page=1&pageSize=4`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.items) setRecentBlogs(d.items.filter((b: any) => b.slug !== slug));
      })
      .catch(() => {});
  }, [slug]);

  const fallback = blogRichFallbacks[slug];
  const title = blog?.title || fallback?.title || 'Blog Article';
  const category = fallback?.category || 'Home Services';
  const imageSrc = blog?.image || fallbackImages[slug] || '/banner_appliance_repair.png';
  const content = blog?.content || fallback?.contentHtml || '<p>No content available for this article.</p>';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <FiChevronRight size={14} />
            <Link href="/blog" className="hover:text-primary">
              Blog
            </Link>
            <FiChevronRight size={14} />
            <span className="truncate max-w-[260px] text-foreground font-medium">{title}</span>
          </nav>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Main Article Content */}
            <article className="lg:col-span-8 rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 sm:p-10">
              {/* Category & Date */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FiCalendar size={13} className="text-primary/70" />
                  {blog?.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'August 2026'}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FiClock size={13} />
                  4 min read
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                {title}
              </h1>

              {/* Author & Share Bar */}
              <div className="mt-6 mb-8 flex items-center justify-between border-y border-slate-100 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    OT
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">OneTap Team</div>
                    <div className="text-[11px] text-muted-foreground">Verified Service Expert</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary"
                >
                  <FiShare2 size={13} />
                  Share
                </button>
              </div>

              {/* Featured Image */}
              <div className="relative mb-8 h-64 w-full overflow-hidden rounded-2xl sm:h-96">
                <Image
                  src={asset(imageSrc)}
                  alt={title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              {/* Article Body */}
              <div
                className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-xl sm:prose-h2:text-2xl"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* Trust Badge Box */}
              <div className="mt-10 rounded-2xl bg-orange-50/70 border border-orange-200/60 p-6">
                <div className="flex items-start gap-3.5">
                  <FiCheckCircle className="h-6 w-6 shrink-0 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground text-sm sm:text-base">
                      Need help with {category.toLowerCase()}?
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      Book verified background-checked service experts directly through OneTap Service. Guaranteed on-time arrival and transparent pricing.
                    </p>
                    <Link
                      href="/services"
                      className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                      Book a Service Now
                    </Link>
                  </div>
                </div>
              </div>

              {/* Back to Blog */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  <FiArrowLeft size={16} />
                  Back to all articles
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Popular Categories */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
                <h3 className="text-base font-bold text-foreground mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['Appliance Care', 'Home Cleaning', 'Electrical', 'Plumbing', 'Moving & Shifting', 'Painting'].map(
                    (cat) => (
                      <Link
                        key={cat}
                        href="/blog"
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        {cat}
                      </Link>
                    ),
                  )}
                </div>
              </div>

              {/* Related / Recent Posts */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
                <h3 className="text-base font-bold text-foreground mb-4">Recent Articles</h3>
                <div className="space-y-4">
                  {(recentBlogs.length > 0
                    ? recentBlogs
                    : [
                        { slug: 'ac-maintenance-tips', title: 'Top 5 AC Maintenance Tips for Summer' },
                        { slug: 'deep-cleaning-essential', title: 'Why Deep Cleaning is Essential Every 6 Months' },
                        { slug: 'electrical-system-upgrade', title: 'Signs Your Home Electrical System Needs an Upgrade' },
                      ]
                  )
                    .filter((b) => b.slug !== slug)
                    .slice(0, 3)
                    .map((item) => (
                      <Link
                        key={item.slug}
                        href={`/blog/${item.slug}`}
                        className="group flex items-center gap-3 no-underline"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            src={asset(fallbackImages[item.slug] || '/banner_appliance_repair.png')}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="line-clamp-2 text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">Read more →</span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>

              {/* CTA Widget */}
              <div className="rounded-3xl bg-gradient-to-br from-primary to-orange-600 p-6 text-white shadow-md">
                <h3 className="text-lg font-bold">OneTap Home Services</h3>
                <p className="mt-2 text-xs text-white/90 leading-relaxed">
                  Book verified appliance repair, cleaning, shifting, plumbing & electrician services in Dhaka in under 2 minutes.
                </p>
                <Link
                  href="/services"
                  className="mt-4 block w-full rounded-xl bg-white py-2.5 text-center text-xs font-bold text-primary shadow transition-all hover:bg-white/90"
                >
                  Explore Services
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
