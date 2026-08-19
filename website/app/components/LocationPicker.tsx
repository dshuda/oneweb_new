'use client';

import { useEffect, useRef, useState } from 'react';
import { FiCrosshair, FiLoader, FiMapPin, FiSearch, FiX } from 'react-icons/fi';
import { MapPreview } from '@/app/components/MapPreview';
import {
  DEFAULT_LOCATION,
  reverseGeocode,
  searchPlaces,
  type PlaceSuggestion,
} from '@/app/lib/location';

/**
 * Modal address picker: search, browse results against a live map, or use the
 * device location. Shared by every place an address is set (profile, cart,
 * checkout) so they all behave identically and all yield real coordinates
 * rather than a free-typed string with no point attached.
 */
export function LocationPicker({
  open,
  onClose,
  onSelect,
  initial,
  title = 'Choose a location',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (place: PlaceSuggestion) => void;
  initial?: PlaceSuggestion | null;
  title?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState<PlaceSuggestion | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(15);
  // Free-text label the customer can add — Mapbox does not know most
  // Bangladeshi street addresses, so the pin plus their own wording is what
  // actually gets the professional to the door.
  const [detail, setDetail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const shown = highlight ?? initial ?? DEFAULT_LOCATION;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setError('');
    setHighlight(initial ?? null);
    setDetail('');
    setZoom(15);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, initial]);

  // Debounced autocomplete.
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  // Close on Escape, like any other dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const useCurrent = () => {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location access.');
      return;
    }
    // Browsers refuse geolocation outside a secure context and report it as a
    // denial, which reads as "you rejected the prompt" when no prompt appeared.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError(
        'Your browser only shares location over a secure (https) connection. ' +
          'This site is served over http, so search for the address or tap the map instead.',
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const resolved = await reverseGeocode(pos.coords.latitude, pos.coords.longitude).catch(
          () => null,
        );
        setHighlight(
          resolved ?? {
            id: 'current',
            name: 'Current Location',
            address: 'Current Location',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        );
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was blocked. Check the padlock icon in the address bar to allow it, or tap the map to place the pin.'
            : 'Could not read your location. Search for the address, or tap the map to place the pin.',
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <FiMapPin className="text-primary" /> {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <FiX size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <MapPreview
            lat={shown.lat}
            lng={shown.lng}
            label={shown.address}
            height={190}
            zoom={zoom}
            onZoom={setZoom}
            onPick={(lat, lng) => {
              // Update coordinate immediately
              setHighlight((prev) => ({
                id: 'pinned',
                name: prev?.name ?? 'Pinned location',
                address: prev?.address ?? 'Pinned location',
                lat,
                lng,
              }));
              // Reverse geocode to resolve area name
              reverseGeocode(lat, lng)
                .then((resolved) => {
                  if (resolved) {
                    setHighlight((prev) => (prev?.lat === lat && prev?.lng === lng ? resolved : prev));
                  }
                })
                .catch(() => {});
            }}
          />

          <div className="mt-3">
            <label htmlFor="loc-detail" className="mb-1 block text-xs font-medium text-foreground">
              Flat / house / road (optional)
            </label>
            <input
              id="loc-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="House 5, Road 32, Dhanmondi"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={useCurrent}
            disabled={locating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {locating ? <FiLoader className="animate-spin" /> : <FiCrosshair />}
            {locating ? 'Locating…' : 'Use my current location'}
          </button>

          {error && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
          )}

          <div className="relative mt-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search area, road or landmark"
              aria-label="Search location"
              className="w-full rounded-xl border border-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto">
            {searching && <p className="px-1 py-2 text-xs text-muted-foreground">Searching…</p>}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="px-1 py-2 text-xs text-muted-foreground">No matches found.</p>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setHighlight(r)}
                onMouseEnter={() => setHighlight(r)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary/10 ${
                  highlight?.id === r.id ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'
                }`}
              >
                <span className="block truncate font-medium">{r.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{r.address}</span>
              </button>
            ))}
          </div>
        </div>

        <footer className="flex gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const extra = detail.trim();
              onSelect(
                extra
                  ? { ...shown, name: extra, address: `${extra}, ${shown.address}` }
                  : shown,
              );
              onClose();
            }}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Use this location
          </button>
        </footer>
      </div>
    </div>
  );
}
