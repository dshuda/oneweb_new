import {
  Briefcase,
  Bug,
  Camera,
  Cctv,
  Droplet,
  Flame,
  Home,
  Laptop,
  Lock,
  Palmtree,
  PawPrint,
  Plane,
  ShieldCheck,
  ShowerHead,
  Smartphone,
  Sofa,
  Sun,
  Truck,
  Tv,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface ServiceData {
  id: number;
  title: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  isBestSeller?: boolean;
  /** Sub-services (tiers/variants) shown in the "View" drawer. */
  subServices?: SubService[];
}

export interface ServiceCategory {
  id: number;
  name: string;
  sub: string;
  slug: string;
  icon: string | LucideIcon;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 1,
    name: 'Cleaning',
    sub: 'Solution',
    slug: 'cleaning',
    icon: '/service-icons/icon_cleaning.svg',
  },
  {
    id: 2,
    name: 'Appliance',
    sub: 'Repair Service',
    slug: 'appliance-repair',
    icon: '/service-icons/icon_appliance.svg',
  },
  {
    id: 3,
    name: 'Shifting',
    sub: 'Service',
    slug: 'shifting',
    icon: '/service-icons/icon_shifting.svg',
  },
  {
    id: 4,
    name: 'Electric &',
    sub: 'Plumbing',
    slug: 'electric-plumbing',
    icon: '/service-icons/icon_plumbing.svg',
  },
  {
    id: 5,
    name: 'Security',
    sub: 'Service',
    slug: 'security',
    icon: '/service-icons/icon_security.svg',
  },
  { id: 6, name: 'Pest', sub: 'Control', slug: 'pest-control', icon: Bug },
  {
    id: 7,
    name: 'Trips &',
    sub: 'Travels',
    slug: 'trips-travels',
    icon: '/service-icons/icon_travel.svg',
  },
  {
    id: 8,
    name: 'Electronic',
    sub: 'Gadget Repair',
    slug: 'gadget-repair',
    icon: '/service-icons/icon_electronics.svg',
  },
];

export const trendingServices: ServiceData[] = [
  {
    id: 1,
    title: 'Full Deep Home Cleaning',
    image: '/service-banners/banner_cleaning.png',
    rating: 4.9,
    reviewCount: 2400,
    price: 1499,
    isBestSeller: true,
    subServices: [
      { id: 1, name: '1 BHK', price: 1499 },
      { id: 2, name: '2 BHK', price: 2199 },
      { id: 3, name: '3 BHK', price: 2999 },
      { id: 4, name: '4 BHK', price: 3799 },
      { id: 5, name: 'Duplex', price: 4599 },
    ],
  },
  {
    id: 2,
    title: 'Master Electrical Checkup',
    image: '/service-banners/banner_electrical_checkup.png',
    rating: 4.8,
    reviewCount: 1100,
    price: 499,
    subServices: [
      { id: 1, name: '1 BHK', price: 499 },
      { id: 2, name: '3 BHK', price: 899 },
    ],
  },
  {
    id: 3,
    title: 'Premium Hair Spa & Trim',
    image: '/service-banners/banner_trim_&_spa.png',
    rating: 5.0,
    reviewCount: 650,
    price: 850,
  },
  {
    id: 4,
    title: 'Accent Wall Painting',
    image: '/service-banners/banner_painting.png',
    rating: 4.7,
    reviewCount: 1500,
    price: 2999,
  },
  {
    id: 5,
    title: 'Accent Wall Painting',
    image: '/service-banners/banner_painting.png',
    rating: 4.7,
    reviewCount: 1500,
    price: 2999,
  },
];

/* ------------------------------------------------------------------ */
/*  Category details — sub-categories (filter tabs) + services         */
/* ------------------------------------------------------------------ */

export interface SubService {
  id: number;
  name: string;
  price: number;
  priceUnit?: string;
  /** Backend ServicePrice id, present when the package came from the API. */
  priceId?: number;
}

export interface CategoryService {
  id: number;
  title: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  priceUnit: string;
  serviceCount: number;
  /** Sub-services (tiers/variants) shown in the "View" drawer. */
  subServices?: SubService[];
}

export interface SubCategory {
  id: number;
  name: string;
  icon: LucideIcon;
  services: CategoryService[];
}

export interface CategoryDetails {
  slug: string;
  name: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  subCategories: SubCategory[];
}

/** Shared hero banner for every category details page. */
export const CATEGORY_HERO_BANNER = '/banner_appliance_repair.png';

const IMG = {
  cleaning: '/service-banners/banner_cleaning.png',
  appliance: '/banner_appliance_repair.png',
  electrical: '/service-banners/banner_electrical_checkup.png',
  painting: '/service-banners/banner_painting.png',
  spa: '/service-banners/banner_trim_&_spa.png',
};

export const categoryDetails: CategoryDetails[] = [
  {
    slug: 'cleaning',
    name: 'Cleaning',
    heroTitle: 'Professional Deep Cleaning',
    heroTitleAccent: 'for a Fresh, Healthy Home',
    heroSubtitle:
      'Keep your home spotless with fast, reliable, and professional cleaning services designed for everyday freshness and lasting hygiene.',
    subCategories: [
      {
        id: 1,
        name: 'Home Cleaning',
        icon: Home,
        services: [
          { id: 1, title: 'Full Deep Home Cleaning', image: IMG.cleaning, rating: 4.9, reviewCount: 2400, price: 1499, priceUnit: '/home', serviceCount: 5, subServices: [{ id: 1, name: '1 BHK', price: 1499 }, { id: 2, name: '2 BHK', price: 2199 }, { id: 3, name: '3 BHK', price: 2999 }, { id: 4, name: '4 BHK', price: 3799 }, { id: 5, name: 'Duplex', price: 4599 }] },
          { id: 2, title: 'Bathroom Deep Cleaning', image: IMG.cleaning, rating: 4.8, reviewCount: 860, price: 599, priceUnit: '/bathroom', serviceCount: 2, subServices: [{ id: 1, name: 'Standard', price: 599 }, { id: 2, name: 'Premium', price: 899 }] },
          { id: 3, title: 'Kitchen Deep Cleaning', image: IMG.cleaning, rating: 4.7, reviewCount: 720, price: 799, priceUnit: '/kitchen', serviceCount: 3, subServices: [{ id: 1, name: 'Modular Kitchen', price: 799 }, { id: 2, name: 'Standard Kitchen', price: 1099 }, { id: 3, name: 'Large Kitchen', price: 1499 }] },
        ],
      },
      {
        id: 2,
        name: 'Sofa & Carpet',
        icon: Sofa,
        services: [
          { id: 4, title: 'Sofa Steam Cleaning', image: IMG.cleaning, rating: 4.8, reviewCount: 640, price: 899, priceUnit: '/sofa', serviceCount: 2, subServices: [{ id: 1, name: '2 Seater', price: 899 }, { id: 2, name: '3 Seater', price: 1299 }] },
          { id: 5, title: 'Carpet Shampoo Cleaning', image: IMG.cleaning, rating: 4.7, reviewCount: 510, price: 749, priceUnit: '/carpet', serviceCount: 1 },
          { id: 6, title: 'Mattress Cleaning', image: IMG.cleaning, rating: 4.9, reviewCount: 430, price: 699, priceUnit: '/mattress', serviceCount: 1 },
        ],
      },
      {
        id: 3,
        name: 'Bathroom Cleaning',
        icon: ShowerHead,
        services: [
          { id: 7, title: 'Bathroom Scrub & Polish', image: IMG.cleaning, rating: 4.6, reviewCount: 380, price: 499, priceUnit: '/bathroom', serviceCount: 2, subServices: [{ id: 1, name: 'Standard', price: 499 }, { id: 2, name: 'Premium', price: 799 }] },
          { id: 8, title: 'Toilet Deep Clean', image: IMG.cleaning, rating: 4.7, reviewCount: 290, price: 349, priceUnit: '/toilet', serviceCount: 1 },
        ],
      },
    ],
  },
  {
    slug: 'appliance-repair',
    name: 'Appliance Repair',
    heroTitle: 'Restore Performance with',
    heroTitleAccent: 'Expert Appliance Repair',
    heroSubtitle:
      'Keep your essential home appliances running smoothly with fast, reliable, and professional repair services designed for lasting performance and everyday convenience.',
    subCategories: [
      {
        id: 1,
        name: 'AC Servicing',
        icon: Wrench,
        services: [
          { id: 1, title: 'AC Jet Wash', image: IMG.appliance, rating: 4.8, reviewCount: 1100, price: 1449, priceUnit: '/person', serviceCount: 4, subServices: [{ id: 1, name: '1-1.5 Ton', price: 1449 }, { id: 2, name: '2-3 Ton', price: 1899 }, { id: 3, name: '3-5 Ton', price: 2499 }, { id: 4, name: 'Window AC', price: 1299 }] },
          { id: 2, title: 'AC Basic Service', image: IMG.appliance, rating: 4.7, reviewCount: 950, price: 449, priceUnit: '/ton', serviceCount: 3, subServices: [{ id: 1, name: '1-1.5 Ton', price: 449 }, { id: 2, name: '2-3 Ton', price: 650 }, { id: 3, name: '3-5 Ton', price: 850 }] },
          { id: 3, title: 'AC Foam Wash', image: IMG.appliance, rating: 4.8, reviewCount: 780, price: 1400, priceUnit: '/ton', serviceCount: 2, subServices: [{ id: 1, name: 'Split AC', price: 1400 }, { id: 2, name: 'Window AC', price: 1600 }] },
          { id: 4, title: 'AC Gas Refill', image: IMG.appliance, rating: 4.6, reviewCount: 640, price: 1200, priceUnit: '/refill', serviceCount: 1 },
        ],
      },
      {
        id: 2,
        name: 'Oven Service',
        icon: Flame,
        services: [
          { id: 5, title: 'Oven Deep Cleaning', image: IMG.appliance, rating: 4.7, reviewCount: 420, price: 1200, priceUnit: '/oven', serviceCount: 2, subServices: [{ id: 1, name: 'Standard Oven', price: 1200 }, { id: 2, name: 'Built-in Oven', price: 1500 }] },
          { id: 6, title: 'Oven Heating Repair', image: IMG.appliance, rating: 4.8, reviewCount: 350, price: 850, priceUnit: '/repair', serviceCount: 1 },
          { id: 7, title: 'Oven Installation', image: IMG.appliance, rating: 4.6, reviewCount: 210, price: 1500, priceUnit: '/installation', serviceCount: 1 },
        ],
      },
      {
        id: 3,
        name: 'TV Service',
        icon: Tv,
        services: [
          { id: 8, title: 'TV Screen Repair', image: IMG.appliance, rating: 4.7, reviewCount: 530, price: 2500, priceUnit: '/screen', serviceCount: 1 },
          { id: 9, title: 'TV Wall Mounting', image: IMG.appliance, rating: 4.9, reviewCount: 480, price: 1500, priceUnit: '/mount', serviceCount: 1 },
          { id: 10, title: 'TV Panel Checkup', image: IMG.appliance, rating: 4.8, reviewCount: 310, price: 900, priceUnit: '/checkup', serviceCount: 1 },
        ],
      },
    ],
  },
  {
    slug: 'shifting',
    name: 'Shifting',
    heroTitle: 'Stress-Free Moving with',
    heroTitleAccent: 'Trusted Shifting Services',
    heroSubtitle:
      'Move homes or offices with complete peace of mind — careful packing, safe transport, and professional shifting crews at one tap.',
    subCategories: [
      {
        id: 1,
        name: 'Home Shifting',
        icon: Home,
        services: [
          { id: 1, title: '1-Bedroom Home Shift', image: IMG.painting, rating: 4.8, reviewCount: 720, price: 4500, priceUnit: '/trip', serviceCount: 3, subServices: [{ id: 1, name: 'Standard', price: 4500 }, { id: 2, name: 'With Packing', price: 6500 }, { id: 3, name: 'Premium', price: 8000 }] },
          { id: 2, title: '3-Bedroom Home Shift', image: IMG.painting, rating: 4.9, reviewCount: 940, price: 8500, priceUnit: '/trip', serviceCount: 4, subServices: [{ id: 1, name: 'Standard', price: 8500 }, { id: 2, name: 'With Packing', price: 11500 }, { id: 3, name: 'Full Service', price: 14000 }, { id: 4, name: 'Premium', price: 17000 }] },
          { id: 3, title: 'Packing & Unpacking', image: IMG.painting, rating: 4.7, reviewCount: 560, price: 2000, priceUnit: '/home', serviceCount: 2, subServices: [{ id: 1, name: 'Basic Packing', price: 2000 }, { id: 2, name: 'Premium Packing', price: 3500 }] },
        ],
      },
      {
        id: 2,
        name: 'Office Shifting',
        icon: Briefcase,
        services: [
          { id: 4, title: 'Small Office Shift', image: IMG.painting, rating: 4.8, reviewCount: 380, price: 6000, priceUnit: '/office', serviceCount: 2, subServices: [{ id: 1, name: '1-2 Rooms', price: 6000 }, { id: 2, name: '3-4 Rooms', price: 9500 }] },
          { id: 5, title: 'Corporate Relocation', image: IMG.painting, rating: 4.9, reviewCount: 290, price: 15000, priceUnit: '/project', serviceCount: 3, subServices: [{ id: 1, name: '5-10 Seats', price: 15000 }, { id: 2, name: '10-25 Seats', price: 25000 }, { id: 3, name: '25+ Seats', price: 40000 }] },
        ],
      },
      {
        id: 3,
        name: 'Vehicle Shifting',
        icon: Truck,
        services: [
          { id: 6, title: 'Bike Shifting', image: IMG.painting, rating: 4.7, reviewCount: 310, price: 1800, priceUnit: '/bike', serviceCount: 1 },
          { id: 7, title: 'Car Shifting', image: IMG.painting, rating: 4.8, reviewCount: 420, price: 3500, priceUnit: '/car', serviceCount: 1 },
        ],
      },
    ],
  },
  {
    slug: 'electric-plumbing',
    name: 'Electric & Plumbing',
    heroTitle: 'Safe & Reliable',
    heroTitleAccent: 'Electric & Plumbing Solutions',
    heroSubtitle:
      'Certified electricians and plumbers for installations, repairs, and maintenance — quick response, clean work, lasting results.',
    subCategories: [
      {
        id: 1,
        name: 'Electrician',
        icon: Zap,
        services: [
          { id: 1, title: 'Master Electrical Checkup', image: IMG.electrical, rating: 4.8, reviewCount: 1100, price: 499, priceUnit: '/checkup', serviceCount: 2, subServices: [{ id: 1, name: '1 BHK', price: 499 }, { id: 2, name: '3 BHK', price: 899 }] },
          { id: 2, title: 'Ceiling Fan Installation', image: IMG.electrical, rating: 4.7, reviewCount: 640, price: 700, priceUnit: '/fan', serviceCount: 1 },
          { id: 3, title: 'Wiring & Rewiring', image: IMG.electrical, rating: 4.8, reviewCount: 510, price: 3500, priceUnit: '/point', serviceCount: 3, subServices: [{ id: 1, name: 'Per Point', price: 3500 }, { id: 2, name: 'Single Room', price: 9000 }, { id: 3, name: 'Full Home', price: 20000 }] },
        ],
      },
      {
        id: 2,
        name: 'Plumber',
        icon: Droplet,
        services: [
          { id: 4, title: 'Tap & Sink Repair', image: IMG.electrical, rating: 4.7, reviewCount: 830, price: 450, priceUnit: '/tap', serviceCount: 1 },
          { id: 5, title: 'Water Leak Fixing', image: IMG.electrical, rating: 4.8, reviewCount: 690, price: 600, priceUnit: '/leak', serviceCount: 1 },
          { id: 6, title: 'Bathroom Fitting', image: IMG.electrical, rating: 4.6, reviewCount: 370, price: 2500, priceUnit: '/fitting', serviceCount: 2, subServices: [{ id: 1, name: 'Standard', price: 2500 }, { id: 2, name: 'Premium', price: 4500 }] },
        ],
      },
    ],
  },
  {
    slug: 'security',
    name: 'Security',
    heroTitle: 'Protect What Matters with',
    heroTitleAccent: 'Professional Security Services',
    heroSubtitle:
      'CCTV installation, trained security guards, and smart locks — comprehensive protection for your home and business, one tap away.',
    subCategories: [
      {
        id: 1,
        name: 'CCTV Installation',
        icon: Cctv,
        services: [
          { id: 1, title: '4-Camera CCTV Package', image: IMG.electrical, rating: 4.8, reviewCount: 520, price: 12000, priceUnit: '/package', serviceCount: 2, subServices: [{ id: 1, name: '4 Camera + DVR', price: 12000 }, { id: 2, name: '4 Camera + Cloud', price: 14500 }] },
          { id: 2, title: 'Single Camera Install', image: IMG.electrical, rating: 4.7, reviewCount: 640, price: 3500, priceUnit: '/camera', serviceCount: 1 },
          { id: 3, title: 'CCTV Maintenance', image: IMG.electrical, rating: 4.8, reviewCount: 310, price: 800, priceUnit: '/visit', serviceCount: 1 },
        ],
      },
      {
        id: 2,
        name: 'Security Guard',
        icon: ShieldCheck,
        services: [
          { id: 4, title: 'Day Guard Service', image: IMG.electrical, rating: 4.7, reviewCount: 430, price: 18000, priceUnit: '/month', serviceCount: 2, subServices: [{ id: 1, name: '1 Guard', price: 18000 }, { id: 2, name: '2 Guards', price: 32000 }] },
          { id: 5, title: 'Night Guard Service', image: IMG.electrical, rating: 4.8, reviewCount: 460, price: 20000, priceUnit: '/month', serviceCount: 2, subServices: [{ id: 1, name: '1 Guard', price: 20000 }, { id: 2, name: '2 Guards', price: 35000 }] },
        ],
      },
      {
        id: 3,
        name: 'Smart Lock',
        icon: Lock,
        services: [
          { id: 6, title: 'Smart Lock Installation', image: IMG.electrical, rating: 4.9, reviewCount: 280, price: 9500, priceUnit: '/lock', serviceCount: 1 },
          { id: 7, title: 'Access Control Setup', image: IMG.electrical, rating: 4.7, reviewCount: 190, price: 15000, priceUnit: '/system', serviceCount: 1 },
        ],
      },
    ],
  },
  {
    slug: 'pest-control',
    name: 'Pest Control',
    heroTitle: 'Keep Your Home Pest-Free with',
    heroTitleAccent: 'Expert Pest Control Services',
    heroSubtitle:
      'Safe and effective treatments for cockroaches, termites, bed bugs, and more — protecting your family and home all year round.',
    subCategories: [
      {
        id: 1,
        name: 'General Pest',
        icon: Bug,
        services: [
          { id: 1, title: 'General Pest Control', image: IMG.cleaning, rating: 4.8, reviewCount: 980, price: 1200, priceUnit: '/home', serviceCount: 3, subServices: [{ id: 1, name: '1 BHK', price: 1200 }, { id: 2, name: '2 BHK', price: 1600 }, { id: 3, name: '3 BHK', price: 2100 }] },
          { id: 2, title: 'Cockroach Treatment', image: IMG.cleaning, rating: 4.7, reviewCount: 740, price: 900, priceUnit: '/home', serviceCount: 2, subServices: [{ id: 1, name: '1 BHK', price: 900 }, { id: 2, name: '3 BHK', price: 1500 }] },
        ],
      },
      {
        id: 2,
        name: 'Termite',
        icon: PawPrint,
        services: [
          { id: 3, title: 'Termite Inspection', image: IMG.cleaning, rating: 4.8, reviewCount: 420, price: 1500, priceUnit: '/inspection', serviceCount: 1 },
          { id: 4, title: 'Termite Treatment', image: IMG.cleaning, rating: 4.9, reviewCount: 560, price: 6000, priceUnit: '/home', serviceCount: 2, subServices: [{ id: 1, name: '1 BHK', price: 6000 }, { id: 2, name: '2 BHK', price: 9000 }] },
        ],
      },
      {
        id: 3,
        name: 'Bed Bug',
        icon: Flame,
        services: [
          { id: 5, title: 'Bed Bug Heat Treatment', image: IMG.cleaning, rating: 4.8, reviewCount: 340, price: 4500, priceUnit: '/home', serviceCount: 2, subServices: [{ id: 1, name: '1 Room', price: 4500 }, { id: 2, name: '2 Rooms', price: 7500 }] },
          { id: 6, title: 'Bed Bug Spray Service', image: IMG.cleaning, rating: 4.7, reviewCount: 260, price: 1800, priceUnit: '/room', serviceCount: 1 },
        ],
      },
    ],
  },
  {
    slug: 'trips-travels',
    name: 'Trips & Travels',
    heroTitle: 'Explore Bangladesh with',
    heroTitleAccent: 'Curated Trips & Travels',
    heroSubtitle:
      'Hand-picked city tours, weekend getaways, and spiritual journeys — comfortable, well-planned travel experiences at one tap.',
    subCategories: [
      {
        id: 1,
        name: 'City Tours',
        icon: Palmtree,
        services: [
          { id: 1, title: 'Dhaka City Day Tour', image: IMG.spa, rating: 4.7, reviewCount: 520, price: 2500, priceUnit: '/person', serviceCount: 3, subServices: [{ id: 1, name: 'Solo', price: 2500 }, { id: 2, name: 'Couple', price: 4500 }, { id: 3, name: 'Group (4+)', price: 1800, priceUnit: '/person' }] },
          { id: 2, title: "Cox's Bazar Tour", image: IMG.spa, rating: 4.9, reviewCount: 780, price: 7500, priceUnit: '/person', serviceCount: 5, subServices: [{ id: 1, name: '3D/2N', price: 7500 }, { id: 2, name: '4D/3N', price: 9500 }, { id: 3, name: '5D/4N', price: 11500 }, { id: 4, name: 'Family Package', price: 11000 }, { id: 5, name: 'Premium', price: 14000 }] },
        ],
      },
      {
        id: 2,
        name: 'Weekend Getaways',
        icon: Sun,
        services: [
          { id: 3, title: 'Sajek Valley Getaway', image: IMG.painting, rating: 4.8, reviewCount: 640, price: 8500, priceUnit: '/person', serviceCount: 4, subServices: [{ id: 1, name: '2D/1N', price: 8500 }, { id: 2, name: '3D/2N', price: 11500 }, { id: 3, name: '4D/3N', price: 14500 }, { id: 4, name: 'Premium', price: 18000 }] },
          { id: 4, title: 'Sylhet Tea Garden Tour', image: IMG.painting, rating: 4.8, reviewCount: 430, price: 6500, priceUnit: '/person', serviceCount: 3, subServices: [{ id: 1, name: '2D/1N', price: 6500 }, { id: 2, name: '3D/2N', price: 9000 }, { id: 3, name: '4D/3N', price: 11500 }] },
        ],
      },
      {
        id: 3,
        name: 'Umrah Packages',
        icon: Plane,
        services: [
          { id: 5, title: '10-Day Economy Umrah', image: IMG.spa, rating: 4.9, reviewCount: 380, price: 85000, priceUnit: '/person', serviceCount: 2, subServices: [{ id: 1, name: 'Economy', price: 85000 }, { id: 2, name: 'Standard', price: 98000 }] },
          { id: 6, title: '14-Day Comfort Umrah', image: IMG.spa, rating: 4.9, reviewCount: 290, price: 115000, priceUnit: '/person', serviceCount: 2, subServices: [{ id: 1, name: 'Comfort', price: 115000 }, { id: 2, name: 'Premium', price: 140000 }] },
        ],
      },
    ],
  },
  {
    slug: 'gadget-repair',
    name: 'Gadget Repair',
    heroTitle: 'Fix It Fast with',
    heroTitleAccent: 'Expert Gadget Repair Services',
    heroSubtitle:
      'Skilled technicians for phones, laptops, tablets, and cameras — genuine parts and quick turnaround for all your gadgets.',
    subCategories: [
      {
        id: 1,
        name: 'Phone Repair',
        icon: Smartphone,
        services: [
          { id: 1, title: 'Screen Replacement', image: IMG.electrical, rating: 4.8, reviewCount: 1200, price: 2500, priceUnit: '/phone', serviceCount: 1 },
          { id: 2, title: 'Battery Replacement', image: IMG.electrical, rating: 4.7, reviewCount: 980, price: 1200, priceUnit: '/phone', serviceCount: 1 },
          { id: 3, title: 'Charging Port Fix', image: IMG.electrical, rating: 4.6, reviewCount: 560, price: 900, priceUnit: '/phone', serviceCount: 1 },
        ],
      },
      {
        id: 2,
        name: 'Laptop Repair',
        icon: Laptop,
        services: [
          { id: 4, title: 'Laptop Screen Repair', image: IMG.electrical, rating: 4.8, reviewCount: 640, price: 4500, priceUnit: '/laptop', serviceCount: 1 },
          { id: 5, title: 'Keyboard Replacement', image: IMG.electrical, rating: 4.7, reviewCount: 420, price: 2500, priceUnit: '/laptop', serviceCount: 1 },
          { id: 6, title: 'Virus & OS Setup', image: IMG.electrical, rating: 4.8, reviewCount: 530, price: 1200, priceUnit: '/laptop', serviceCount: 2, subServices: [{ id: 1, name: 'OS Installation', price: 1200 }, { id: 2, name: 'OS + Data Backup', price: 1800 }] },
        ],
      },
      {
        id: 3,
        name: 'Tablet & Camera',
        icon: Camera,
        services: [
          { id: 7, title: 'Tablet Screen Repair', image: IMG.electrical, rating: 4.7, reviewCount: 310, price: 3500, priceUnit: '/tablet', serviceCount: 1 },
          { id: 8, title: 'Camera Sensor Cleaning', image: IMG.electrical, rating: 4.6, reviewCount: 220, price: 2000, priceUnit: '/camera', serviceCount: 1 },
        ],
      },
    ],
  },
];

export function getCategoryDetailsBySlug(slug: string) {
  return categoryDetails.find((c) => c.slug === slug);
}

/* ------------------------------------------------------------------ */
/*  Service details — rich content for the View Details drawer         */
/* ------------------------------------------------------------------ */

export interface ServiceStep {
  title: string;
  description: string;
  /** Optional thumbnail shown on the Working Progress timeline. */
  image?: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceReview {
  name: string;
  rating: number;
  comment: string;
}

export type EssentialIcon = 'socket' | 'bucket' | 'water' | 'tool';

export interface ServiceEssential {
  icon: EssentialIcon;
  label: string;
}

export interface ServiceDetails {
  about: string;
  workingSteps: ServiceStep[];
  includes: string[];
  excludes: string[];
  notes: string[];
  essentials: ServiceEssential[];
  faqs: ServiceFaq[];
  reviews: ServiceReview[];
}

/** Rich details keyed by exact service title. */
export const serviceDetailsByTitle: Record<string, ServiceDetails> = {
  'AC Jet Wash': {
    about:
      'This “AC Jet Wash” service includes deep cleaning of indoor and outdoor AC units using high-pressure jet wash technology for improved cooling performance and airflow. The cleaning process includes dust removal, coil cleaning, filter cleaning, drain line cleaning, and complete jet wash treatment. The service is performed by experienced professionals to ensure safe and effective cleaning. The total servicing process will take approximately 60–90 minutes depending on the AC condition.',
    workingSteps: [
      {
        title: 'Filter & Coil Cleaning',
        description:
          'The cleaning process includes thorough cleaning of AC filters, cooling coils, and internal components to remove accumulated dirt, bacteria, and blocked airflow that reduce cooling efficiency.',
        image: '/service-banners/banner_cleaning.png',
      },
      {
        title: 'High-Pressure Jet Wash',
        description:
          'Our professionals use specialized jet wash equipment to deeply clean the evaporator and condenser areas, removing stubborn dirt, mud, and debris for maximum cooling performance and healthier air circulation.',
        image: '/service-banners/banner_electrical_checkup.png',
      },
      {
        title: 'Drying & Final Performance Check',
        description:
          'After cleaning, the AC unit is properly dried and reassembled. A final performance check is conducted to ensure smooth airflow, efficient cooling, and proper functioning of the system.',
        image: '/banner_appliance_repair.png',
      },
    ],
    includes: [
      'Indoor & outdoor unit jet wash cleaning',
      'Air filter cleaning',
      'Cooling coil cleaning',
      'Drain line cleaning',
      'Basic performance inspection',
    ],
    excludes: [
      'AC gas refill/replacement',
      'Spare parts replacement',
      'PCB or electrical repair',
      'Chemical treatment for severe damage',
      'Installation or uninstallation service',
    ],
    notes: [
      'This service is applicable for residential AC units only',
      'Customer must ensure electricity availability during servicing',
      'Excessively damaged or leaking units may require additional repair service',
    ],
    essentials: [
      { icon: 'socket', label: 'Socket' },
      { icon: 'bucket', label: 'Bucket' },
      { icon: 'water', label: 'Water Source' },
    ],
    faqs: [
      {
        question: 'How often should I take AC jet wash service?',
        answer:
          'For best cooling performance and air quality, servicing is recommended every 4–6 months depending on usage.',
      },
      {
        question: 'Is AC jet wash safe for older AC units?',
        answer:
          'Yes, jet wash cleaning is safe for older units when performed by trained professionals, provided the unit is structurally sound.',
      },
      {
        question: 'How do I know if my AC needs jet wash cleaning?',
        answer:
          'Reduced cooling, weak airflow, unusual smells, or visible dust build-up on the indoor unit are common signs that a jet wash is needed.',
      },
      {
        question: 'Do I need to remove furniture before the service?',
        answer:
          'It helps to keep the area around the indoor and outdoor units clear so the professional can work safely and efficiently.',
      },
      {
        question: 'Can this service remove bad smells from the AC?',
        answer:
          'Yes — deep cleaning of the coils and drain line removes the dirt and bacteria that cause musty odours.',
      },
      {
        question: 'Do I need to provide any equipment for the service?',
        answer:
          'No, our professional brings all the required tools and cleaning equipment.',
      },
      {
        question: 'How frequently should I book this service?',
        answer:
          'We recommend every 4–6 months, or more often in dusty or high-usage conditions.',
      },
    ],
    reviews: [
      {
        name: 'Rejwan Ahmed',
        rating: 4.5,
        comment:
          'My carpets look brand new, and my sofa feels fresh and spotless. The team was professional, efficient, and used high-quality products that left no residue or harsh smells. Highly recommended for anyone looking to refresh their living space.',
      },
      {
        name: 'Mst. Mariyam Sultana',
        rating: 4.8,
        comment:
          'Outstanding service! My furniture and carpets have never looked better. The team was professional, punctual, and thorough. Everything smells fresh and feels so clean. I will definitely be using this service again.',
      },
      {
        name: 'Md. Faruk Ahmed',
        rating: 4.5,
        comment:
          'Best cleaning service I have tried. They were meticulous and left my furniture and carpets spotless. It is like having a brand-new living room. Cannot recommend them enough.',
      },
    ],
  },
  'AC Basic Service': {
    about:
      'The “AC Basic Service” keeps your AC running smoothly with a quick, professional maintenance visit. It covers filter cleaning, cooling coil inspection, dust removal, and a basic performance check — perfect for routine upkeep between deep cleans. Completed in about 30–45 minutes.',
    workingSteps: [
      {
        title: 'Inspection & Safety Check',
        description:
          'The professional inspects the unit, checks the wiring and mounts, and verifies safe operating conditions before starting the service.',
      },
      {
        title: 'Filter & Coil Cleaning',
        description:
          'Air filters and accessible cooling coils are cleaned to remove dust and improve airflow and cooling efficiency.',
      },
      {
        title: 'Basic Performance Check',
        description:
          'The unit is switched on and checked for cooling performance, airflow, and any unusual noise before handover.',
      },
    ],
    includes: [
      'Air filter cleaning',
      'Cooling coil inspection & dust removal',
      'Drain line check',
      'Basic cooling performance test',
    ],
    excludes: [
      'AC gas refill/replacement',
      'Spare parts replacement',
      'PCB or electrical repair',
      'Deep jet wash cleaning',
    ],
    notes: [
      'This service is applicable for residential AC units only',
      'Customer must ensure electricity availability during servicing',
    ],
    essentials: [
      { icon: 'socket', label: 'Socket' },
      { icon: 'tool', label: 'Tools' },
    ],
    faqs: [
      {
        question: 'How long does AC basic service take?',
        answer: 'Typically 30–45 minutes depending on the unit condition and accessibility.',
      },
      {
        question: 'How often should I book a basic service?',
        answer: 'Every 1–2 months in between deep cleans keeps airflow and cooling optimal.',
      },
      {
        question: 'Do I need to be present during the service?',
        answer: 'Yes, we recommend someone responsible be present during the visit.',
      },
    ],
    reviews: [],
  },
  'AC Foam Wash': {
    about:
      'The “AC Foam Wash” uses a gentle foam-based cleaning method to deep clean AC coils and internal parts without excess water. It removes dust, grime, and allergens for better cooling and cleaner air, and is safer for units where heavy jet washing is not ideal. Takes about 45–60 minutes.',
    workingSteps: [
      {
        title: 'Coverage & Protection',
        description:
          'Surrounding areas are covered and protected before the chemical foam treatment is applied.',
      },
      {
        title: 'Foam Application & Cleaning',
        description:
          'A professional-grade cleaning foam is applied to the coils and internal components, dissolving dirt and grime.',
      },
      {
        title: 'Rinse & Final Check',
        description:
          'The unit is rinsed, dried, and reassembled, followed by a final cooling performance check.',
      },
    ],
    includes: [
      'Foam cleaning of indoor & outdoor coils',
      'Dust and grime removal',
      'Drain line cleaning',
      'Cooling performance check',
    ],
    excludes: [
      'AC gas refill/replacement',
      'Spare parts replacement',
      'PCB or electrical repair',
      'Installation or uninstallation service',
    ],
    notes: [
      'This service is applicable for residential AC units only',
      'Foam wash is gentler on the unit — ideal for older ACs',
      'Customer must ensure electricity availability during servicing',
    ],
    essentials: [
      { icon: 'socket', label: 'Socket' },
      { icon: 'bucket', label: 'Bucket' },
      { icon: 'water', label: 'Water Source' },
    ],
    faqs: [
      {
        question: 'What is the difference between foam wash and jet wash?',
        answer:
          'Foam wash uses chemical foam to dissolve dirt with minimal water, while jet wash uses high-pressure water. Foam wash is gentler on older units.',
      },
      {
        question: 'How often should I take a foam wash?',
        answer: 'Every 4–6 months, or when cooling performance drops.',
      },
      {
        question: 'Is foam wash safe for my AC?',
        answer: 'Yes, the foam is designed for AC coils and is applied by trained professionals.',
      },
    ],
    reviews: [],
  },
  'AC Gas Refill': {
    about:
      'The “AC Gas Refill” restores your AC’s cooling power by checking the refrigerant level, detecting any leaks, and refilling with quality refrigerant gas. The unit is then tested for cooling performance. Takes approximately 60–90 minutes depending on the unit.',
    workingSteps: [
      {
        title: 'Leak Detection Test',
        description:
          'The professional runs a full leak test on the unit to locate any points where refrigerant may be escaping.',
      },
      {
        title: 'Gas Evacuation & Refill',
        description:
          'Old or low refrigerant is evacuated safely and the unit is refilled with the correct amount of quality gas.',
      },
      {
        title: 'Cooling Performance Test',
        description:
          'The unit is run and tested for cooling output, pressure, and airflow to confirm the refill was successful.',
      },
    ],
    includes: [
      'Refrigerant pressure check',
      'Leak detection test',
      'Gas refill with quality refrigerant',
      'Cooling performance test',
    ],
    excludes: [
      'Repair of leaks requiring spare parts',
      'PCB or electrical repair',
      'Compressor replacement',
      'Installation or uninstallation service',
    ],
    notes: [
      'This service is applicable for residential split AC units only',
      'Existing refrigerant leaks may require additional repair service',
      'Gas refill cost depends on the unit capacity',
    ],
    essentials: [
      { icon: 'socket', label: 'Socket' },
      { icon: 'tool', label: 'Tools' },
    ],
    faqs: [
      {
        question: 'How do I know my AC needs a gas refill?',
        answer:
          'Weak cooling, ice on the coils, or hissing sounds are common signs of low refrigerant.',
      },
      {
        question: 'How often does an AC need gas?',
        answer:
          'A properly sealed AC should hold its charge for years; frequent refills usually indicate a leak.',
      },
      {
        question: 'Is the gas refill cost included in the service price?',
        answer:
          'The service price includes the standard refill. Additional gas for larger units may be billed separately.',
      },
    ],
    reviews: [],
  },
};

/**
 * Returns rich service details for the View Details drawer. Falls back to a
 * sensible auto-generated set so every service gets a complete drawer.
 */
export function getServiceDetails(title: string): ServiceDetails {
  const explicit = serviceDetailsByTitle[title];
  if (explicit) return explicit;

  return {
    about: `${title} is carried out by our verified professionals using the right tools and materials. Quality assured, on-time service — one tap away.`,
    workingSteps: [
      {
        title: 'Inspection & Preparation',
        description:
          'The professional inspects the area and prepares everything needed to carry out the service safely and efficiently.',
      },
      {
        title: 'Service Execution',
        description: `The ${title.toLowerCase()} is performed carefully, following standard quality guidelines for the best result.`,
      },
      {
        title: 'Final Check & Handover',
        description:
          'A final quality check is completed and the service is handed over with a clean finish.',
      },
    ],
    includes: [
      'Professional service visit',
      'Quality assured workmanship',
      'Safe handling of your property',
    ],
    excludes: ['Spare parts replacement', 'Major repairs outside this service scope'],
    notes: [
      'Please keep the service area accessible',
      'Inform the professional of any specific requirements beforehand',
    ],
    essentials: [
      { icon: 'socket', label: 'Socket' },
      { icon: 'tool', label: 'Tools' },
    ],
    faqs: [
      {
        question: 'How long does this service take?',
        answer: `Typically 60–90 minutes depending on the condition and requirements of the ${title.toLowerCase()} service.`,
      },
      {
        question: 'Do I need to be present during the service?',
        answer: 'Yes, we recommend someone responsible be present for the service visit.',
      },
      {
        question: 'Is the service guaranteed?',
        answer: 'Yes, all bookings are backed by our quality assurance policy.',
      },
    ],
    reviews: [],
  };
}
