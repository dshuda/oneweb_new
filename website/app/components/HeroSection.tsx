"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiChevronDown, FiMapPin, FiSearch } from "react-icons/fi";
import { asset } from '@/app/lib/assets';
import {
  DEFAULT_LOCATION,
  hasPickedLocation,
  loadLocation,
  saveLocation,
  type PlaceSuggestion,
} from '@/app/lib/location';
import { LocationPicker } from '@/app/components/LocationPicker';

// Locations come from the geocoder now, not a fixed list.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function HeroSection() {
  const [place, setPlace] = useState<PlaceSuggestion>(DEFAULT_LOCATION);
  const location = place.name;
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [term, setTerm] = useState('');
  // Every route into the search bar should confirm where the service is going,
  // but only until a location is actually chosen — otherwise the modal would
  // reopen on every keystroke and make the service search unusable.
  const [locationConfirmed, setLocationConfirmed] = useState(true);

  // Restore the visitor's previous choice; defaults to Green Road, Dhaka.
  useEffect(() => {
    setPlace(loadLocation());
    setLocationConfirmed(hasPickedLocation());
  }, []);

  const runSearch = () => {
    const q = term.trim();
    window.location.href = q
      ? `${basePath}/services?search=${encodeURIComponent(q)}`
      : `${basePath}/services`;
  };

  /** Ask for the location first when the visitor has not set one yet. */
  const ensureLocation = () => {
    if (locationConfirmed) return false;
    setIsLocationOpen(true);
    return true;
  };


  const choosePlace = (next: PlaceSuggestion) => {
    setPlace(next);
    saveLocation(next);
    setLocationConfirmed(true);
    setIsLocationOpen(false);
  };



  return (
    <section className="relative w-full bg-primary">
      {/* Banner image — headline & subtitle are baked into the artwork */}
      <div className="relative h-[360px] w-full overflow-hidden sm:h-[480px] lg:h-auto lg:aspect-[1920/666]">
        <Image
          src={asset('/banner_hero.png')}
          alt="Expert Services, One tap away. Making everyday home services faster, easier, and more reliable with skilled professionals just a tap away."
          fill
          priority
          sizes="100vw"
          className="object-cover object-left lg:object-center"
        />
      </div>

      {/* SEO heading (visual copy is part of the banner) */}
      <h1 className="sr-only">Expert Services, One tap away.</h1>

      {/* Floating Search Bar */}
      <div className="absolute bottom-0 left-1/2 z-20 w-full max-w-3xl -translate-x-1/2 translate-y-1/2 px-4 sm:px-6 py-4">
        <div className="relative flex items-center gap-2 rounded-2xl bg-white p-3.5 shadow-2xl shadow-primary/30 sm:gap-2.5 sm:p-4">
          {/* Location Box */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              // The label below is hidden on phones, which would leave this
              // button an unlabelled pin icon for screen readers and tests.
              aria-label={`Change location — currently ${location}`}
              aria-expanded={isLocationOpen}
              className="flex h-12 items-center gap-2 rounded-xl bg-primary/5 px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 sm:px-4"
            >
              <FiMapPin size={16} className="shrink-0 text-primary" />
              <span className="hidden sm:inline">{location}</span>
              <FiChevronDown size={14} className="shrink-0 text-muted-foreground" />
            </button>

          </div>

          <div className="h-7 w-px shrink-0 bg-border" />

          {/* Search Box */}
          <Input
            type="text"
            value={term}
            placeholder="Search for Services"
            onFocus={ensureLocation}
            onChange={(e) => {
              if (ensureLocation()) return;
              setTerm(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              if (ensureLocation()) return;
              runSearch();
            }}
            className="h-12 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0 sm:px-3"
          />

          {/* Search Button */}
          <Button
            size="icon-lg"
            aria-label="Search"
            onClick={() => {
              if (ensureLocation()) return;
              runSearch();
            }}
            className="h-12 w-12 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/40 hover:bg-primary/90"
          >
            <FiSearch size={18} />
          </Button>

        </div>
      </div>
      <LocationPicker
        open={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        initial={place}
        title="Where do you need the service?"
        onSelect={choosePlace}
      />
    </section>
  );
}
