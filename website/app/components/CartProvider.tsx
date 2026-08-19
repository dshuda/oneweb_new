'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ScheduleDrawer from './ScheduleDrawer';
import CartDrawer from './CartDrawer';
import { useAuth } from './AuthProvider';
import { loadCart, saveCart, type CartItem } from '@/app/lib/storage';
import { loadLocation } from '@/app/lib/location';

interface ScheduleInfo {
  serviceTitle: string;
  subName?: string;
  image: string;
  price: number;
  priceUnit?: string;
  /** Backend ids, present only for API-sourced services. */
  serviceId?: number;
  priceId?: number;
}

type ScheduleRequest =
  | ({ mode: 'add' } & ScheduleInfo)
  | ({ mode: 'edit'; itemId: string } & ScheduleInfo & {
      date: string;
      time: string;
    });

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  requestSchedule: (info: ScheduleInfo) => void;
  requestScheduleEdit: (itemId: string) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const { user, authOpen, openAuth } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [scheduleRequest, setScheduleRequest] =
    useState<ScheduleRequest | null>(null);
  const [pendingSchedule, setPendingSchedule] =
    useState<ScheduleInfo | null>(null);
  const idRef = useRef(0);

  // Load the persisted cart after mount (deferred to avoid SSR mismatches)
  // and keep it in sync with localStorage whenever it changes. Seed the id
  // counter past any persisted ids so new items never collide.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const stored = loadCart();
    setItems(stored);
    const maxId = stored.reduce((max, item) => {
      const n = Number(item.id.replace('item-', ''));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, -1);
    idRef.current = maxId + 1;
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      saveCart(items);
    }
  }, [items, loaded]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const requestSchedule = useCallback(
    (info: ScheduleInfo) => {
      // Require login before scheduling: logged-in users go straight to the
      // schedule sheet, everyone else goes through the login flow first.
      if (user) {
        setScheduleRequest({ mode: 'add', ...info });
      } else {
        setPendingSchedule(info);
        openAuth('schedule');
      }
    },
    [user, openAuth],
  );

  // Resume the pending booking once the user logs in.
  useEffect(() => {
    if (pendingSchedule && user) {
      setScheduleRequest({ mode: 'add', ...pendingSchedule });
      setPendingSchedule(null);
    }
  }, [pendingSchedule, user]);

  // Cancel a pending booking if the login drawer is dismissed while logged out.
  useEffect(() => {
    if (pendingSchedule && !user && !authOpen) {
      setPendingSchedule(null);
    }
  }, [pendingSchedule, user, authOpen]);

  const requestScheduleEdit = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        setScheduleRequest({
          mode: 'edit',
          itemId,
          serviceTitle: item.serviceTitle,
          subName: item.subName,
          image: item.image,
          price: item.price,
          priceUnit: item.priceUnit,
          serviceId: item.serviceId,
          priceId: item.priceId,
          date: item.date,
          time: item.time,
        });
      }
    },
    [items],
  );

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const handleScheduleContinue = useCallback(
    (date: string, time: string) => {
      if (!scheduleRequest) return;
      if (scheduleRequest.mode === 'edit') {
        setItems((prev) =>
          prev.map((item) =>
            item.id === scheduleRequest.itemId
              ? { ...item, date, time }
              : item,
          ),
        );
      } else {
        const id = `item-${idRef.current++}`;
        const newItem: CartItem = {
          id,
          serviceTitle: scheduleRequest.serviceTitle,
          subName: scheduleRequest.subName,
          image: scheduleRequest.image,
          price: scheduleRequest.price,
          priceUnit: scheduleRequest.priceUnit,
          serviceId: scheduleRequest.serviceId,
          priceId: scheduleRequest.priceId,
          date,
          time,
          qty: 1,
          location: (() => {
            const place = loadLocation();
            return { address: place.address, lat: place.lat, lng: place.lng };
          })(),
        };
        setItems((prev) => [...prev, newItem]);
      }
      setScheduleRequest(null);
      setCartOpen(true);
    },
    [scheduleRequest],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cartCount: items.reduce((sum, item) => sum + item.qty, 0),
      cartOpen,
      openCart,
      closeCart,
      requestSchedule,
      requestScheduleEdit,
      updateQty,
      removeItem,
      clearCart,
    }),
    [
      items,
      cartOpen,
      openCart,
      closeCart,
      requestSchedule,
      requestScheduleEdit,
      updateQty,
      removeItem,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* Shared schedule sheet (add + edit modes) */}
      <ScheduleDrawer
        open={scheduleRequest !== null}
        onOpenChange={(open) => {
          if (!open) setScheduleRequest(null);
        }}
        serviceTitle={scheduleRequest?.serviceTitle ?? ''}
        subName={scheduleRequest?.subName}
        price={scheduleRequest?.price ?? 0}
        priceUnit={scheduleRequest?.priceUnit}
        initialDate={
          scheduleRequest?.mode === 'edit' ? scheduleRequest.date : undefined
        }
        initialTime={
          scheduleRequest?.mode === 'edit' ? scheduleRequest.time : undefined
        }
        onContinue={handleScheduleContinue}
      />

      {/* Shared cart drawer */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onEditSchedule={requestScheduleEdit}
      />
    </CartContext.Provider>
  );
}
