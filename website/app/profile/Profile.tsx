'use client';

import { LocationPicker } from '@/app/components/LocationPicker';
import { MapPreview } from '@/app/components/MapPreview';
import { loadLocation, saveLocation, type PlaceSuggestion } from '@/app/lib/location';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Settings,
  ShoppingBag,
  UserRound,
  Wallet,
} from 'lucide-react';
import { FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/components/AuthProvider';
import {
  loadBookings,
  removeBooking,
  loadUserProfile,
  saveUserProfile,
  type Booking,
  type UserProfile,
} from '@/app/lib/storage';
import { MASTER_PHONE, SHOW_TEST_CREDENTIALS } from '@/app/lib/auth';
import { cancelOrder, getOrders, updateName, type ApiOrder } from '@/app/lib/api';
import { formatDateParts } from '@/lib/utils';
import { asset } from '@/app/lib/assets';

type Tab = 'overview' | 'bookings' | 'settings';

function formatPhone(phone: string): string {
  return phone.length === 11
    ? `${phone.slice(0, 5)} ${phone.slice(5)}`
    : phone;
}

function formatBookedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** One row of the bookings list, whether it came from the API or localStorage. */
interface BookingView {
  id: string;
  label: string;
  /** "Wed 12 · 02:30 PM" — only known for locally scheduled bookings. */
  schedule?: string;
  bookedAt?: string;
  paymentLabel: string;
  statusLabel: string;
  total: number;
  serviceCount: number;
  reference?: string;
  /** Set when the row is a real order that can be cancelled server-side. */
  local: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: 'Cash on Delivery',
  cod: 'Cash on Delivery',
  online: 'Online',
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

function fromApiOrder(order: ApiOrder): BookingView {
  return {
    id: `api-${order.id}`,
    label: order.service?.name ?? 'Service',
    bookedAt: order.createdAt ?? undefined,
    paymentLabel:
      PAYMENT_LABELS[order.paymentType ?? ''] ??
      (order.paymentType ? titleCase(order.paymentType) : 'Not set'),
    statusLabel: titleCase(order.deliveryStatus || 'pending'),
    total: order.grandTotal ?? 0,
    serviceCount: 1,
    reference: order.trackingCode ?? undefined,
    local: false,
  };
}

function fromLocalBooking(booking: Booking): BookingView {
  const first = booking.items[0];
  const label = first
    ? first.subName
      ? `${first.serviceTitle} (${first.subName})`
      : first.serviceTitle
    : 'Service';
  const { dayShort, dayNumber } = first
    ? formatDateParts(first.date)
    : { dayShort: '', dayNumber: '' };

  return {
    id: booking.id,
    label,
    schedule: first ? `${dayShort} ${dayNumber} · ${first.time}` : undefined,
    bookedAt: booking.createdAt,
    paymentLabel: booking.payment === 'cod' ? 'Cash on Delivery' : 'Online',
    statusLabel: 'Confirmed',
    total: booking.total,
    serviceCount: booking.items.reduce((sum, i) => sum + i.qty, 0),
    reference: booking.trackingCodes?.[0],
    local: true,
  };
}

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-green-100 text-green-700',
  Confirmed: 'bg-green-100 text-green-700',
};

function BookingRow({
  booking,
  onDelete,
}: {
  booking: BookingView;
  onDelete: (booking: BookingView) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {booking.label}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {booking.schedule && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} className="shrink-0 text-primary" />
                {booking.schedule}
              </span>
            )}
            {booking.bookedAt && (
              <span>· Booked {formatBookedAt(booking.bookedAt)}</span>
            )}
            <span>· {booking.paymentLabel}</span>
            {booking.reference && <span>· {booking.reference}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              STATUS_STYLES[booking.statusLabel] ?? 'bg-primary/10 text-primary'
            }`}
          >
            {booking.statusLabel}
          </span>
          <button
            type="button"
            aria-label={booking.local ? 'Delete booking' : 'Cancel booking'}
            onClick={() => onDelete(booking)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-sm">
        <span className="text-muted-foreground">
          {booking.serviceCount}{' '}
          {booking.serviceCount === 1 ? 'service' : 'services'}
        </span>
        <span className="font-bold text-primary">
          ৳{booking.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, openAuth, logout, setUserName } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ name: '', address: '' });
  const [draft, setDraft] = useState<UserProfile>({ name: '', address: '' });
  const [pickerOpen, setPickerOpen] = useState(false);
  // Coordinates behind the typed address, so the profile stores a real point.
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);

  // Seed the map from the location already chosen in the header.
  useEffect(() => {
    setPlace(loadLocation());
  }, []);
  const [savedFlash, setSavedFlash] = useState(false);

  /**
   * Bookings come from the API. Anything that was only ever saved locally
   * (services the API doesn't carry, or checkouts placed while it was down) is
   * appended so nothing silently disappears from the user's history.
   */
  const refreshBookings = useCallback(async () => {
    const local = loadBookings();
    const localViews = local.map(fromLocalBooking);

    try {
      const result = await getOrders();
      const placedCodes = new Set(
        local.flatMap((b) => b.trackingCodes ?? []),
      );
      const apiViews = result.items.map(fromApiOrder);
      // Drop the local mirror of anything the API already reports.
      const localOnly = localViews.filter(
        (view) => !view.reference || !placedCodes.has(view.reference),
      );
      setBookings([
        ...apiViews,
        ...localOnly.filter((view) => !view.reference),
      ]);
      setOffline(false);
    } catch {
      setBookings(localViews);
      setOffline(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const stored = loadUserProfile();
    const resolvedName = stored.name || user?.name || '';
    const initialProfile: UserProfile = {
      name: resolvedName,
      address: stored.address || '',
    };
    setProfile(initialProfile);
    setDraft(initialProfile);
    void refreshBookings();
    // Support deep links like /profile?tab=bookings.
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'overview' || t === 'bookings' || t === 'settings') {
      setTab(t);
    }
  }, [refreshBookings, user?.name]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDeleteBooking = async (booking: BookingView) => {
    if (booking.local) {
      removeBooking(booking.id);
    } else {
      try {
        await cancelOrder(Number(booking.id.replace('api-', '')));
      } catch {
        // Surfaced by the row staying put after the refresh below.
      }
    }
    await refreshBookings();
  };

  const handleSaveProfile = async () => {
    const next = { name: draft.name.trim(), address: draft.address.trim() };
    saveUserProfile(next);
    setProfile(next);
    setDraft(next);
    if (next.name) {
      setUserName(next.name);
      try {
        await updateName(next.name);
      } catch (err) {
        console.warn('Could not sync name to server:', err);
      }
    }
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  if (!user) {
    /* ---- Not signed in ---- */
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 lg:pt-36">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-foreground">My Dashboard</span>
        </nav>

        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound size={30} />
          </span>
          <h1 className="text-2xl font-extrabold text-foreground">
            You're not signed in
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Log in with your phone number to view your dashboard, bookings, and
            profile.
          </p>
          <Button
            className="mt-2 rounded-full px-8"
            onClick={() => openAuth()}
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  // Only label the bootstrap account when test credentials are enabled;
  // a public deploy must not hint that this number is special.
  const isMaster = SHOW_TEST_CREDENTIALS && user.phone === MASTER_PHONE;
  const displayName = profile.name || user.name || 'OneTap User';
  const totalSpend = bookings.reduce((sum, b) => sum + b.total, 0);
  const totalServices = bookings.reduce((sum, b) => sum + b.serviceCount, 0);

  const navItems: {
    id: Tab;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bookings', label: 'My Bookings', icon: CalendarDays, count: bookings.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    {
      label: 'Total Bookings',
      value: loaded ? bookings.length : '–',
      icon: CalendarDays,
    },
    {
      label: 'Total Spend',
      value: loaded ? `৳${totalSpend.toLocaleString()}` : '–',
      icon: Wallet,
    },
    {
      label: 'Services Booked',
      value: loaded ? totalServices : '–',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          My Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {displayName} — manage your bookings and profile.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* ---- Sidebar (desktop) ---- */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            {/* Mini profile */}
            <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound size={22} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatPhone(user.phone)}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav
              aria-label="Dashboard"
              className="space-y-1.5 rounded-3xl border border-border/80 bg-white p-3 shadow-sm"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-foreground/70 hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {item.label}
                    {item.count !== undefined && (
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <Button
              variant="outline"
              className="w-full gap-2 rounded-2xl py-2.5"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </aside>

        {/* ---- Mobile tabs ---- */}
        <div className="scrollbar-hide -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setTab(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-white text-foreground/70 shadow-sm hover:text-primary'
                }`}
              >
                <Icon size={16} />
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-xs font-bold ${
                      active ? 'bg-white/20' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---- Content ---- */}
        <section className="min-w-0">
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#7a4fb3] p-6 text-white shadow-lg shadow-primary/30 sm:p-7">
                <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/5" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/75">
                      {isMaster ? 'Master account' : 'Welcome back'}
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold">
                      Hi, {displayName} 👋
                    </h2>
                    <p className="mt-1.5 max-w-md text-sm text-white/80">
                      You have {bookings.length} booking
                      {bookings.length === 1 ? '' : 's'} so far. Need help with
                      a new service?
                    </p>
                  </div>
                  <Link href="/services">
                    <Button className="rounded-full bg-white px-5 text-primary hover:bg-white/90">
                      Book a Service
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-3xl border border-border/80 bg-white p-5 shadow-sm"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon size={20} />
                      </span>
                      <p className="mt-3 text-2xl font-extrabold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Recent bookings */}
              <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    Recent Bookings
                  </h3>
                  {bookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('bookings')}
                      className="text-sm font-semibold text-primary transition-colors hover:text-primary/70 hover:underline"
                    >
                      View all
                    </button>
                  )}
                </div>
                {bookings.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <CalendarDays size={36} className="text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      No bookings yet
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      When you confirm a payment, your bookings will appear
                      here.
                    </p>
                    <Link href="/services" className="mt-1">
                      <Button className="rounded-full">
                        Explore Services
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        onDelete={handleDeleteBooking}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    All Bookings
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {loaded
                      ? `${bookings.length} ${
                          bookings.length === 1 ? 'booking' : 'bookings'
                        } found`
                      : 'Loading…'}
                  </p>
                </div>
                <Link href="/services">
                  <Button variant="outline" className="rounded-full">
                    Browse Services
                  </Button>
                </Link>
              </div>

              {offline && loaded && (
                <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Showing bookings saved on this device — the booking service
                  could not be reached.
                </p>
              )}

              {bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <CalendarDays size={36} className="text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    No bookings yet
                  </p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Book a service to see your schedule and history here.
                  </p>
                  <Link href="/services" className="mt-1">
                    <Button className="rounded-full">Explore Services</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      onDelete={handleDeleteBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-6">
              {/* Edit profile */}
              <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Pencil size={16} className="text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Edit Profile
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="mb-1.5 block text-sm font-semibold text-foreground"
                    >
                      Full Name
                    </label>
                    <Input
                      id="profile-name"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      placeholder="Your full name"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-address"
                      className="mb-1.5 block text-sm font-semibold text-foreground"
                    >
                      Address
                    </label>
                    <Input
                      id="profile-address"
                      value={draft.address}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, address: e.target.value }))
                      }
                      placeholder="House, Road, Area, City"
                      className="h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                    >
                      <MapPin size={13} /> Pick on map
                    </button>
                    {place && (
                      <div className="mt-2">
                        <MapPreview
                          lat={place.lat}
                          lng={place.lng}
                          label={draft.address || place.address}
                          height={130}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      className="rounded-full"
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                    {savedFlash && (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                        <CheckCircle2 size={15} />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact / phone */}
              <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="mb-4 text-base font-bold text-foreground">
                  Contact Info
                </h3>
                <div className="space-y-3">
                  <p className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                    <UserRound size={16} className="shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">
                      {draft.name || profile.name || user.name || 'No name set yet'}
                    </span>
                  </p>
                  <p className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                    <Phone size={16} className="shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">
                      {formatPhone(user.phone)}
                    </span>
                    {isMaster && (
                      <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        Demo
                      </span>
                    )}
                  </p>
                  <p className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      {draft.address || profile.address || 'No address added yet'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Demo hint */}
              {isMaster && (
                <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <Image
                    src={asset('/illustration_mobile_no.svg')}
                    alt=""
                    width={48}
                    height={48}
                    className="h-10 w-auto shrink-0"
                  />
                  <div>
                    <p className="font-bold text-foreground">Master account</p>
                    <p className="mt-0.5 text-muted-foreground">
                      You're signed in with the bootstrap test number{' '}
                      <span className="font-semibold text-primary">
                        {MASTER_PHONE}
                      </span>
                      . Log out to try the login flow again.
                    </p>
                  </div>
                </div>
              )}

              {/* Logout (mobile) */}
              <Button
                variant="outline"
                className="w-full gap-2 rounded-2xl py-2.5 lg:hidden"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          )}
        </section>
      </div>

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={place}
        title="Set your address"
        onSelect={(next) => {
          setPlace(next);
          // Keep the header in sync so the cart and checkout agree.
          saveLocation(next);
          setDraft((d) => ({ ...d, address: next.address }));
        }}
      />
    </div>
  );
}
