'use client';

import { useEffect, useState } from 'react';
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

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSchedule: (itemId: string) => void;
}

const PROMO_CODE = 'SAVE40';
const OFFER_AMOUNT = 40;
const DEFAULT_NAME = 'Anila Jaman';
const DEFAULT_ADDRESS = 'House: 15, Road No.: 12, Dhanmondi, Dhaka-1205';

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
  const [postLoginReopen, setPostLoginReopen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(DEFAULT_NAME);
  const [userAddress, setUserAddress] = useState(DEFAULT_ADDRESS);
  const [draftName, setDraftName] = useState(userName);
  const [draftAddress, setDraftAddress] = useState(userAddress);
  const [promoValue, setPromoValue] = useState(PROMO_CODE);
  const [promoApplied, setPromoApplied] = useState(true);
  const [promoError, setPromoError] = useState('');
  const [payment, setPayment] = useState<'online' | 'cod'>('cod');

  // Close the success/edit states whenever the drawer is opened — except for
  // the automatic reopen right after logging in to complete a checkout.
  useEffect(() => {
    if (open && !postLoginReopen) {
      setEditing(false);
      setConfirmed(false);
      setPromoError('');
    }
    setPostLoginReopen(false);
  }, [open]);

  // Keep the User Info. section in sync with the saved profile: fill it from
  // the profile whenever the drawer opens (so edits made on the Profile page
  // are picked up), and restore the guest defaults after logout so a previous
  // user's details aren't shown.
  useEffect(() => {
    if (!user) {
      setUserName(DEFAULT_NAME);
      setUserAddress(DEFAULT_ADDRESS);
      setDraftName(DEFAULT_NAME);
      setDraftAddress(DEFAULT_ADDRESS);
      return;
    }
    if (!open) return;
    const profile = loadUserProfile();
    const nextName = profile.name || user.name || '';
    const nextAddress = profile.address || '';
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

  const completeCheckout = () => {
    const paid = payable;
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    addBooking({
      id: `bk-${Date.now()}`,
      items: items.map((item) => ({ ...item })),
      total: paid,
      payment,
      createdAt: new Date().toISOString(),
    });
    setPaidAmount(paid);
    setPaidCount(count);
    setConfirmed(true);
    clearCart();
  };

  const handleConfirm = () => {
    // Require login before completing checkout.
    if (!user) {
      setAwaitingLogin(true);
      onOpenChange(false);
      openAuth('checkout');
      return;
    }
    completeCheckout();
  };

  // Resume and complete the pending checkout as soon as the user logs in.
  useEffect(() => {
    if (awaitingLogin && user) {
      setAwaitingLogin(false);
      if (items.length === 0) return;
      setPostLoginReopen(true);
      completeCheckout();
      onOpenChange(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingLogin, user]);

  // Cancel a pending checkout if the login drawer is dismissed while logged
  // out, and return the user to the cart so they can retry.
  useEffect(() => {
    if (awaitingLogin && !user && !authOpen) {
      setAwaitingLogin(false);
      onOpenChange(true);
    }
  }, [awaitingLogin, user, authOpen]);

  return (
    <Drawer swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white">
        {confirmed ? (
          /* ---- Payment success ---- */
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FiCheckCircle size={48} className="text-primary" />
            <DrawerTitle className="text-xl font-bold text-foreground">
              Payment Successful!
            </DrawerTitle>
            <DrawerDescription className="max-w-xs">
              {paidCount} {paidCount === 1 ? 'service' : 'services'} booked · ৳
              {paidAmount.toLocaleString()}. Our team will confirm your
              bookings shortly.
            </DrawerDescription>
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
              <Button
                size="lg"
                className="w-full rounded-xl bg-primary hover:bg-primary/90"
                onClick={handleConfirm}
              >
                Confirm Payment · ৳{payable.toLocaleString()}
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
