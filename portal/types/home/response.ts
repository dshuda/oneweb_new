export interface Slider {
  id: number;
  title: string | null;
  photoId: number | null;
  link: string | null;
}
export interface PromotionItem {
  id: number;
  title: string;
  subTitle?: string;
  buttonText?: string;
  link: string;
  image: string;
}
export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  serviceIcon:string ;
  children?: ServiceCategory[];
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  bannerImage: string | null;
  initialPrice: number;
  isTrending: boolean;
}

