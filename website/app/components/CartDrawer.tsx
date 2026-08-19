'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Minus,
  Pencil,
  Plus,
  User,
} from 'lucide-react';
import { FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from './CartProvider';
import { useAuth } from './AuthProvider';
import { formatDateParts } from '@/lib/utils';
import {
  addBooking,
  loadUserProfile,
  saveUserProfile,
} from '@/app/lib/storage';
import { ApiError, createOrder, initiateSslCommerz } from '@/app/lib/api';
import { hasPickedLocation, loadLocation } from '@/app/lib/location';
import { MapPreview } from '@/app/components/MapPreview';
import { LocationPicker } from '@/app/components/LocationPicker';
import { saveLocation, type PlaceSuggestion } from '@/app/lib/location';
import { toApiTime } from '@/app/lib/catalog';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSchedule: (itemId: string) => void;
}

const PROMO_CODE = 'SAVE40';
const OFFER_AMOUNT = 40;
const DEFAULT_NAME = 'Anila Jaman';
/*
 * The service address and coordinates come from the location the customer
 * picked in the header — never a hardcoded demo address, which previously meant
 * every order shipped to the same Dhanmondi flat regardless of the selection.
 */

export default function CartDrawer({
  open,
  onOpenChange,
  onEditSchedule,
}: CartDrawerProps) {
  const { items, updateQty, removeItem, clearCart } = useCart();
  const { user, authOpen, openAuth } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [awaitingLogin, setAwaitingLogin] = useState(false);
  // One-shot flag: set just before the drawer is reopened after login, read
  // by the reset effect. A ref keeps it out of the dependency graph.
  const postLoginReopen = useRef(false);
  const [placing, setPlacing] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(DEFAULT_NAME);
  const [userAddress, setUserAddress] = useState('');
  // Coordinates that will be sent with the order — kept in state so the map
  // shown here is the same point the backend receives, not a re-geocode.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const [draftAddress, setDraftAddress] = useState('');
  const [promoValue, setPromoValue] = useState(PROMO_CODE);
  const [promoApplied, setPromoApplied] = useState(true);
  const [promoError, setPromoError] = useState('');
  const [payment, setPayment] = useState<'online' | 'cod'>('cod');

  // Close the success/edit states whenever the drawer is opened — except for
  // the automatic reopen right after logging in to complete a checkout.
  useEffect(() => {
    if (open && !postLoginReopen.current) {
      setEditing(false);
      setConfirmed(false);
      setPromoError('');
      setSyncNote('');
      setCheckoutError('');
    }
    postLoginReopen.current = false;
  }, [open]);

  // Keep the User Info. section in sync with the saved profile: fill it from
  // the profile whenever the drawer opens (so edits made on the Profile page
  // are picked up), and restore the guest defaults after logout so a previous
  // user's details aren't shown.
  useEffect(() => {
    if (!user) {
      const picked = loadLocation();
      const fallback = picked.address;
      setCoords({ lat: picked.lat, lng: picked.lng });
      setUserName(DEFAULT_NAME);
      setUserAddress(fallback);
      setDraftName(DEFAULT_NAME);
      setDraftAddress(fallback);
      return;
    }
    if (!open) return;
    const profile = loadUserProfile();
    const nextName = profile.name || user.name || '';
    // A saved profile address wins; otherwise follow the picked location.
    const picked = loadLocation();
    setCoords({ lat: picked.lat, lng: picked.lng });
    // An address chosen on the map is where the service must go, so it beats the
    // saved profile address — you often book for somewhere other than home.
    const nextAddress = hasPickedLocation() ? picked.address : profile.address || picked.address;
    if (nextName) {
      setUserName(nextName);
      setDraftName(nextName);
    }
    if (nextAddress) {
      setUserAddress(nextAddress);
      setDraftAddress(nextAddress);
    }
  }, [user, open]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const offer = promoApplied ? OFFER_AMOUNT : 0;
  const payable = subtotal - offer;

  const applyPromo = () => {
    if (promoValue.trim().toUpperCase() === PROMO_CODE) {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoApplied(false);
      setPromoError('Invalid promo code');
    }
  };

  /**
   * Place the booking. Each cart line becomes one order on the API; lines the
   * API doesn't know about (services that only exist in the local catalogue)
   * still land in the local booking history so the flow never dead-ends.
   */
  const completeCheckout = useCallback(async () => {
    const paid = payable;
    const snapshot = items.map((item) => ({ ...item }));
    const count = snapshot.reduce((sum, item) => sum + item.qty, 0);

    setPlacing(true);
    setCheckoutError('');
    const trackingCodes: string[] = [];
    const orderIds: number[] = [];
    const reasons: string[] = [];
    let failures = 0;

    for (const item of snapshot) {
      try {
        // Cards come from the API, so every cart line already knows its
        // backend ids. A line without one predates that and can't be ordered.
        if (!item.serviceId) {
          failures += 1;
          reasons.push(`"${item.serviceTitle}" is no longer available — please add it again.`);
          continue;
        }
        // Sequential by design: the API validates coupon usage per order, so
        // parallel creation could race its per-user limit check.
        // oxlint-disable-next-line no-await-in-loop
        // The location stamped on the item wins; if the item predates this
        // field, fall back to whatever is selected in the header now.
        const place = item.location ?? (() => {
          const current = loadLocation();
          return { address: current.address, lat: current.lat, lng: current.lng };
        })();
        const order = await createOrder({
          serviceId: item.serviceId,
          priceId: item.priceId ?? 0,
          serviceDate: item.date,
          time: toApiTime(item.time),
          shippingAddress: userAddress?.trim() ? userAddress : place.address,
          latitude: String(place.lat),
          longitude: String(place.lng),
          locationName: place.address,
          additionalInfo: item.subName
            ? `${item.serviceTitle} — ${item.subName} × ${item.qty}`
            : `${item.serviceTitle} × ${item.qty}`,
          paymentType: payment === 'cod' ? 'cash_on_delivery' : 'online',
          couponCode: promoApplied ? promoValue.trim() : null,
        });
        if (order?.trackingCode) trackingCodes.push(order.trackingCode);
        if (order?.orderId) orderIds.push(order.orderId);
      } catch (error) {
        failures += 1;
        // Keep the server's own wording — "Service not found or not available"
        // is far more actionable than a generic failure line.
        reasons.push(
          error instanceof ApiError
            ? `"${item.serviceTitle}": ${error.message}`
            : `"${item.serviceTitle}" could not be booked.`,
        );
      }
    }

    // ── Online payment ────────────────────────────────────────────────
    // Never fall back to the local "booked" path here: no gateway redirect
    // means no money moved, so claiming success would be a lie. Keep the cart
    // and say what went wrong.
    if (payment === 'online') {
      if (orderIds.length === 0) {
        setPlacing(false);
        setCheckoutError(
          `We could not create your order, so online payment cannot start. ${reasons[0] ?? ''}`.trim(),
        );
        return;
      }

      // Record the booking before redirecting so it survives leaving the page.
      addBooking({
        id: `bk-${Date.now()}`,
        items: snapshot,
        total: paid,
        payment,
        createdAt: new Date().toISOString(),
        trackingCodes,
      });

      try {
        const session = await initiateSslCommerz(orderIds[0]);
        if (session?.gatewayPageUrl) {
          clearCart();
          window.location.href = session.gatewayPageUrl;
          return;
        }
        setCheckoutError(
          'The payment gateway did not return a checkout page. Your booking is saved — choose Cash on Delivery or retry payment from My Bookings.',
        );
      } catch {
        setCheckoutError(
          'Could not reach the payment gateway. Your booking is saved — choose Cash on Delivery or retry payment from My Bookings.',
        );
      }

      setPlacing(false);
      return;
    }

    addBooking({
      id: `bk-${Date.now()}`,
      items: snapshot,
      total: paid,
      payment,
      createdAt: new Date().toISOString(),
      trackingCodes,
    });

    setPlacing(false);
    setSyncNote(
      failures > 0 && trackingCodes.length === 0
        ? `Saved locally — ${reasons[0] ?? 'the booking service could not be reached'}. Our team will confirm by phone.`
        : failures > 0
          ? `Some items are awaiting confirmation: ${reasons[0] ?? ''}`.trim()
          : '',
    );
    setPaidAmount(paid);
    setPaidCount(count);
    setConfirmed(true);
    clearCart();
    // Memoised so the post-login effect can depend on it honestly. The effect
    // is guarded by `awaitingLogin`, which it clears immediately, so a
    // dependency change cannot re-run the checkout.
  }, [items, payable, payment, promoApplied, promoValue, userAddress, clearCart]);

  const handleConfirm = () => {
    // Require login before completing checkout.
    if (!user) {
      setAwaitingLogin(true);
      onOpenChange(false);
      openAuth('checkout');
      return;
    }
    void completeCheckout();
  };

  // Resume and complete the pending checkout as soon as the user logs in.
  useEffect(() => {
    if (awaitingLogin && user) {
      setAwaitingLogin(false);
      if (items.length === 0) return;
      postLoginReopen.current = true;
      void completeCheckout();
      onOpenChange(true);
    }
  }, [awaitingLogin, user, items.length, onOpenChange, completeCheckout]);

  // Cancel a pending checkout if the login drawer is dismissed while logged
  // out, and return the user to the cart so they can retry.
  useEffect(() => {
    if (awaitingLogin && !user && !authOpen) {
      setAwaitingLogin(false);
      onOpenChange(true);
    }
  }, [awaitingLogin, user, authOpen, onOpenChange]);

  return (
    <Drawer swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white">
        {confirmed ? (
          /* ---- Payment success ---- */
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FiCheckCircle size={48} className="text-primary" />
            <DrawerTitle className="text-xl font-bold text-foreground">
              Order Successful!
            </DrawerTitle>
            <DrawerDescription className="max-w-xs">
              {paidCount} {paidCount === 1 ? 'service' : 'services'} booked · ৳
              {paidAmount.toLocaleString()}. Our team will confirm your
              bookings shortly.
            </DrawerDescription>
            {syncNote && (
              <p className="max-w-xs text-xs text-muted-foreground">
                {syncNote}
              </p>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <Button
                className="rounded-full px-6"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
              <Link href="/profile?tab=bookings" onClick={() => onOpenChange(false)}>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                >
                  View My Bookings
                </Button>
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* ---- Empty cart ---- */
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FiTrash2 size={40} className="text-muted-foreground" />
            <DrawerTitle className="text-lg font-bold text-foreground">
              Your cart is empty
            </DrawerTitle>
            <DrawerDescription>
              Add a service to start booking.
            </DrawerDescription>
            <Button
              variant="outline"
              className="mt-2 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <DrawerHeader className="border-b">
              <div className="flex items-center gap-3">
                <DrawerClose
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft size={20} />
                </DrawerClose>
                <DrawerTitle className="text-lg font-bold text-foreground">
                  Cart
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </DrawerTitle>
              </div>
            </DrawerHeader>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
              {/* Cart items */}
              <div className="space-y-3">
                {items.map((item) => {
                  const { dayShort, dayNumber } = formatDateParts(item.date);
                  const label = item.subName
                    ? `${item.serviceTitle} (${item.subName})`
                    : item.serviceTitle;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border/80 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                          <Image
                            src={item.image}
                            alt={label}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {label}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateQty(item.id, Math.max(1, item.qty - 1))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary/85"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-foreground">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQty(item.id, Math.min(9, item.qty + 1))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary/85"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            aria-label={`Remove ${label}`}
                            onClick={() => removeItem(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                          >
                            <FiTrash2 size={15} />
                          </button>
                          <span className="text-base font-bold text-primary">
                            ৳{(item.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Per-item schedule */}
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <CalendarDays
                            size={14}
                            className="shrink-0 text-primary"
                          />
                          {dayShort} {dayNumber} · {item.time}
                        </span>
                        <button
                          type="button"
                          aria-label="Edit schedule"
                          onClick={() => onEditSchedule(item.id)}
                          className="flex items-center gap-1 rounded-md text-primary transition-colors hover:text-primary/70"
                        >
                          <Pencil size={12} />
                          <span className="text-xs font-semibold">Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">
                    User Info.
                  </h4>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="gap-1 rounded-full"
                    onClick={() => {
                      setDraftName(userName);
                      setDraftAddress(userAddress);
                      setEditing((e) => !e);
                    }}
                  >
                    <Pencil size={11} />
                    Edit
                  </Button>
                </div>
                {editing ? (
                  <div className="space-y-2 rounded-xl border border-border/80 bg-white p-3">
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      aria-label="Full name"
                    />
                    <Input
                      value={draftAddress}
                      onChange={(e) => setDraftAddress(e.target.value)}
                      aria-label="Address"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                    >
                      <MapPin size={13} /> Pick on map
                    </button>
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          const nextName = draftName.trim();
                          const nextAddress = draftAddress.trim();
                          setUserName(nextName);
                          setUserAddress(nextAddress);
                          // Persist edits to the saved profile so the
                          // auto-fill stays in sync next time.
                          if (user) {
                            saveUserProfile({
                              name: nextName,
                              address: nextAddress,
                            });
                          }
                          setEditing(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-border/80 bg-white p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <User size={15} className="shrink-0 text-primary" />
                      <span className="truncate">{userName}</span>
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={15} className="shrink-0 text-primary" />
                      <span className="truncate">{userAddress}</span>
                    </p>
                    {/* The exact point sent with the order, so there is no doubt
                        where the professional is being sent. */}
                    {coords && (
                      <MapPreview
                        lat={coords.lat}
                        lng={coords.lng}
                        label={userAddress}
                        height={120}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground">
                  Promo Code
                </h4>
                <div className="flex gap-2">
                  <Input
                    value={promoValue}
                    onChange={(e) => {
                      setPromoValue(e.target.value);
                      setPromoApplied(false);
                      setPromoError('');
                    }}
                    placeholder="Apply Promo Code"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    className="shrink-0 rounded-lg px-3"
                    onClick={applyPromo}
                  >
                    <ArrowRight size={16} />
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-xs font-medium text-green-600">
                    ✓ {PROMO_CODE} applied
                  </p>
                )}
                {promoError && (
                  <p className="text-xs font-medium text-destructive">
                    {promoError}
                  </p>
                )}
              </div>

              {/* Payment Option */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground">
                  Payment Option
                </h4>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-white p-3 transition-colors hover:border-primary/30">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === 'online'}
                      onChange={() => setPayment('online')}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Online Payment
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-white p-3 transition-colors hover:border-primary/30">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === 'cod'}
                      onChange={() => setPayment('cod')}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Cash on Delivery
                    </span>
                  </label>
                </div>
              </div>

              {/* Billing Details */}
              <div className="space-y-2.5 rounded-2xl border border-border/80 bg-white p-4">
                <h4 className="text-sm font-bold text-foreground">
                  Billing Details
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="font-medium text-foreground">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                {offer > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Offer Price</span>
                    <span className="font-medium text-destructive">
                      ৳-{offer}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2.5 text-sm">
                  <span className="font-bold text-foreground">
                    Total Payable
                  </span>
                  <span className="font-bold text-primary">
                    ৳{payable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Payment */}
            <div className="shrink-0 border-t p-4">
              {checkoutError && (
                <p
                  role="alert"
                  className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
                >
                  {checkoutError}
                </p>
              )}
              <Button
                size="lg"
                disabled={placing}
                className="w-full rounded-xl bg-primary hover:bg-primary/90"
                onClick={handleConfirm}
              >
                {placing
                  ? 'Placing your booking…'
                  : `Confirm Payment · ৳${payable.toLocaleString()}`}
              </Button>
            </div>
          </>
        )}
      </DrawerContent>

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={
          coords ? { id: 'current', name: userAddress, address: userAddress, ...coords } : null
        }
        title="Where should we come?"
        onSelect={(next: PlaceSuggestion) => {
          setDraftAddress(next.address);
          setUserAddress(next.address);
          setCoords({ lat: next.lat, lng: next.lng });
          // Header, cart and checkout must all agree on the same point.
          saveLocation(next);
        }}
      />
    </Drawer>
  );
}
