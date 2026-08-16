'use client';

import { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface ScheduleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTitle: string;
  subName?: string;
  price: number;
  priceUnit?: string;
  initialDate?: string;
  initialTime?: string;
  onContinue: (selectedDate: string, selectedTime: string) => void;
}

function localISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TODAY_ISO = localISO(new Date());

interface DayOption {
  key: string;
  label: string;
  dayNumber: number;
  date: string;
}

function getNextDays(count: number): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      key: localISO(d),
      label:
        i === 0
          ? 'Today'
          : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      date: localISO(d),
    });
  }
  return days;
}

const TIME_SLOTS = (() => {
  const slots: { time: string; disabled: boolean }[] = [];
  for (let h = 9; h <= 19; h++) {
    for (const m of [0, 30]) {
      if (h === 19 && m === 30) break;
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const mm = m === 0 ? '00' : '30';
      slots.push({
        time: `${String(hour12).padStart(2, '0')}:${mm} ${ampm}`,
        disabled: false,
      });
    }
  }
  for (const t of ['09:30 AM', '02:30 PM', '06:30 PM']) {
    const slot = slots.find((s) => s.time === t);
    if (slot) slot.disabled = true;
  }
  return slots;
})();

const FIRST_AVAILABLE_TIME = TIME_SLOTS.find((s) => !s.disabled)?.time ?? '';

export default function ScheduleDrawer({
  open,
  onOpenChange,
  serviceTitle,
  subName,
  price,
  priceUnit,
  initialDate,
  initialTime,
  onContinue,
}: ScheduleDrawerProps) {
  const days = getNextDays(12);
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [selectedTime, setSelectedTime] = useState(FIRST_AVAILABLE_TIME);

  // Initialize selection every time the drawer is opened (keeps the
  // currently scheduled date/time when re-opening to edit).
  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate ?? TODAY_ISO);
      setSelectedTime(initialTime ?? FIRST_AVAILABLE_TIME);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="w-full bg-white sm:mx-auto sm:w-1/2">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="text-lg font-bold text-foreground">
            Schedule
          </DrawerTitle>
          <DrawerDescription>
            {subName ? `${serviceTitle} — ${subName}` : serviceTitle} · ৳
            {price.toLocaleString()}
            {priceUnit && ` ${priceUnit}`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-5">
          {/* Pickup Date */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">
              Pickup Date
            </h4>
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {days.map((day) => {
                const isSelected = day.date === selectedDate;
                return (
                  <button
                    key={day.key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(day.date)}
                    className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-2.5 text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-white text-foreground hover:border-primary/40'
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-white/85' : 'text-muted-foreground'
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className="text-base font-bold">{day.dayNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pickup Time */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">
              Pickup Time
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot.time === selectedTime;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.disabled}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-all ${
                      slot.disabled
                        ? 'cursor-not-allowed border-border/60 bg-muted/60 text-muted-foreground/50'
                        : isSelected
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-white text-foreground hover:border-primary/40'
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="shrink-0 border-t p-4">
          <Button
            size="lg"
            className="w-full rounded-xl bg-primary hover:bg-primary/90"
            onClick={() => onContinue(selectedDate, selectedTime)}
          >
            Continue to Checkout
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
