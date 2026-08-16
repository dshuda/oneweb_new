export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  isActive: boolean;
  emailVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: number;
  userId?: number;
  address?: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
}

export interface Role {
  id: number;
  name: string;
  guardName: string;
  description?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt?: string;
}

export interface Order {
  id: number;
  userId: number;
  orderCode: string;
  orderAmount: number;
  originalAmount: number;
  discountAmount: number;
  discountType?: string;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentNote?: string;
  shippingAddress?: string;
  shippingCityId?: number;
  orderDate?: string;
  status: string;
  createdAt?: string;
  user?: User;
  details?: OrderDetail[];
}

export interface OrderDetail {
  id: number;
  orderId: number;
  serviceId: number;
  priceId: number;
  serviceName: string;
  variant?: string;
  price: number;
  tax: number;
  quantity: number;
  discount: number;
  vendorId: number;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  brandId?: number;
  vendorId?: number;
  shortDescription?: string;
  description?: string;
  appDescription?: string;
  thumbnail?: string;
  featured: boolean;
  isActive: boolean;
  orderLevel: number;
  brand?: Brand;
  prices?: ServicePrice[];
}

export interface ServicePrice {
  id: number;
  serviceId: number;
  variantOptionId?: number;
  variant?: string;
  price: number;
  cost?: number;
  stock: number;
  sku?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  brandLogo?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  isTrending: boolean;
  status: boolean;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  address?: string;
  description?: string;
  isActive: boolean;
}

export interface Coupon {
  id: number;
  type: string;
  code: string;
  details?: string;
  discount: number;
  discountType: string;
  startDate?: number;
  endDate?: number;
  usageLimit?: number;
  usageCount: number;
  status: boolean;
}

export interface Payment {
  id: number;
  orderId: number;
  transactionId?: string;
  amount: number;
  method: string;
  status: string;
  note?: string;
  createdAt?: string;
}

export interface Blog {
  id: number;
  title: string;
  slug: string;
  categoryId: number;
  content: string;
  appContent?: string;
  image?: string;
  status: boolean;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface CustomPage {
  id: number;
  title: string;
  slug: string;
  link: string;
  type: string;
  content?: string;
  status: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Division {
  id: number;
  name: string;
}

export interface District {
  id: number;
  divisionId: number;
  name: string;
}

export interface Upazila {
  id: number;
  districtId: number;
  name: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  pagination?: Pagination;
  error?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 
  | 'cash_on_delivery'
  | 'online'
  | 'wallet'
  | 'card'
  | 'bank_transfer';