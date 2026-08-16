export interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export interface ServiceCard {
  id: string;
  title: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  isBestSeller?: boolean;
}

export interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
