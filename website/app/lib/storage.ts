import { resolveApiBase } from './api';

/**
 * Where the service should be delivered. Captured when the item is added so a
 * later change to the header location does not silently move an existing
 * booking, and carried through checkout to the order.
 */
export interface CartLocation {
  address: string;
  lat: number;
  lng: number;
}

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
  /** Backend service id — set when the item came from the API catalogue. */
  serviceId?: number;
  /** Backend service-price id for the chosen package (0 = base price). */
  priceId?: number;
  /** Location selected when this item was added to the cart. */
  location?: CartLocation;
}

export interface Booking {
  id: string;
  items: CartItem[];
  total: number;
  payment: 'online' | 'cod';
  createdAt: string;
  /** Tracking codes returned by the API for the orders this booking created. */
  trackingCodes?: string[];
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

interface CartRecord {
  /** API the items' serviceId/priceId belong to. */
  apiBase: string;
  items: CartItem[];
}

/**
 * Cart lines carry backend ids, and those ids only mean something against the
 * API they came from — point the site at a different backend (or reseed one)
 * and they silently refer to the wrong service, or to nothing at all. So the
 * cart is stamped with its origin and dropped when that changes.
 */
export function loadCart(): CartItem[] {
  const record = read<CartRecord | CartItem[]>(CART_KEY);
  if (!record) return [];

  // Legacy shape: a bare array with no origin. Its ids can't be trusted.
  if (Array.isArray(record)) {
    saveCart([]);
    return [];
  }

  if (record.apiBase !== resolveApiBase()) {
    saveCart([]);
    return [];
  }

  return record.items ?? [];
}

export function saveCart(items: CartItem[]): void {
  write(CART_KEY, { apiBase: resolveApiBase(), items } satisfies CartRecord);
}

export function loadBookings(): Booking[] {
  return read<Booking[]>(BOOKINGS_KEY) ?? [];
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
