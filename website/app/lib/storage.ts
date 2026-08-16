export interface CartItem {
  id: string;
  serviceTitle: string;
  subName?: string;
  image: string;
  price: number;
  priceUnit?: string;
  date: string;
  time: string;
  qty: number;
}

export interface Booking {
  id: string;
  items: CartItem[];
  total: number;
  payment: 'online' | 'cod';
  paymentStatus?: string;
  deliveryStatus?: string;
  trackingCode?: string;
  createdAt: string;
}

const CART_KEY = 'onetap.cart.v1';
const BOOKINGS_KEY = 'onetap.bookings.v1';
const PROFILE_KEY = 'onetap.profile.v1';

export interface UserProfile {
  name: string;
  address: string;
}

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/security errors.
  }
}

export function loadCart(): CartItem[] {
  const data = read<unknown>(CART_KEY);
  return Array.isArray(data) ? (data as CartItem[]) : [];
}

export function saveCart(items: CartItem[]): void {
  write(CART_KEY, Array.isArray(items) ? items : []);
}

export function loadBookings(): Booking[] {
  const data = read<unknown>(BOOKINGS_KEY);
  return Array.isArray(data) ? (data as Booking[]) : [];
}

export function saveBookings(bookings: Booking[]): void {
  write(BOOKINGS_KEY, bookings);
}

export function addBooking(booking: Booking): void {
  saveBookings([booking, ...loadBookings()]);
}

export function removeBooking(id: string): void {
  saveBookings(loadBookings().filter((b) => b.id !== id));
}

export function loadUserProfile(): UserProfile {
  return read<UserProfile>(PROFILE_KEY) ?? { name: '', address: '' };
}

export function saveUserProfile(profile: UserProfile): void {
  write(PROFILE_KEY, profile);
}
