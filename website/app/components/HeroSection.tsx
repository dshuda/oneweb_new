"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiCrosshair,
  FiLoader,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";

const locations = [
  "Select Location",
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Khulna",
  "Rajshahi",
];

export default function HeroSection() {
  const [location, setLocation] = useState("Select Location");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Auto-dismiss the location error message after a few seconds.
  useEffect(() => {
    if (!locationError) return;
    const timer = setTimeout(() => setLocationError(null), 5000);
    return () => clearTimeout(timer);
  }, [locationError]);

  const handleUseCurrentLocation = () => {
    setIsLocationOpen(false);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocation("Current Location");
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please allow access to use your current location."
            : "Unable to get your location. Please try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <section className="relative w-full bg-primary">
      {/* Banner image — headline & subtitle are baked into the artwork */}
      <div className="relative h-[360px] w-full overflow-hidden sm:h-[480px] lg:h-auto lg:aspect-[1920/666]">
        <Image
          src="/banner_hero.png"
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
              className="flex h-12 items-center gap-2 rounded-xl bg-primary/5 px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 sm:px-4"
            >
              <FiMapPin size={16} className="shrink-0 text-primary" />
              <span className="hidden sm:inline">{location}</span>
              {isLocating ? (
                <FiLoader
                  size={14}
                  className="shrink-0 animate-spin text-primary"
                />
              ) : (
                <FiChevronDown
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
              )}
            </button>

            {isLocationOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLocating ? (
                    <FiLoader size={14} className="shrink-0 animate-spin" />
                  ) : (
                    <FiCrosshair size={14} className="shrink-0" />
                  )}
                  {isLocating ? "Locating…" : "Use Current Location"}
                </button>
                <div className="h-px bg-border" />
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocation(loc);
                      setIsLocationOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 ${
                      location === loc
                        ? "font-semibold text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-7 w-px shrink-0 bg-border" />

          {/* Search Box */}
          <Input
            type="text"
            placeholder="Search for Services"
            className="h-12 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0 sm:px-3"
          />

          {/* Search Button */}
          <Button
            size="icon-lg"
            aria-label="Search"
            className="h-12 w-12 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/40 hover:bg-primary/90"
          >
            <FiSearch size={18} />
          </Button>

          {/* Location error message */}
          {locationError && (
            <p
              role="status"
              className="absolute top-full left-1/2 mt-2 w-max max-w-[90vw] -translate-x-1/2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm"
            >
              {locationError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
