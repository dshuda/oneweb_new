/**
 * Location search backed by Mapbox Geocoding.
 *
 * Only the public (pk.) token is used here — it is inlined into the client
 * bundle, so the secret sk. token must never be referenced from this file.
 */

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

/** Public (pk.) token — safe in the browser; used for map tiles and geocoding. */
export const MAP_TOKEN = TOKEN;

/**
 * Google Places (New) key. Google's Dhaka coverage is far better than Mapbox's
 * — Mapbox returns nothing for "Dhanmondi 32" — so when this is configured it
 * becomes the primary source of suggestions. Places API (New) permits browser
 * calls, so no server proxy is needed. Restrict the key by HTTP referrer.
 */
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

/**
 * Barikoi is a Bangladeshi geocoder with far denser local coverage than either
 * Google or Mapbox — it knows road- and holding-level addresses in Dhaka that
 * the global providers have never heard of. When a key is present it is tried
 * first, and the others become fallbacks.
 */
const BARIKOI_KEY = process.env.NEXT_PUBLIC_BARIKOI_KEY ?? '';
export const BARIKOI_ENABLED = Boolean(BARIKOI_KEY);
export const GOOGLE_PLACES_ENABLED = Boolean(GOOGLE_KEY);
const COUNTRY = process.env.NEXT_PUBLIC_GEOCODE_COUNTRY ?? 'bd';

export interface PlaceSuggestion {
  id: string;
  /** Short label, e.g. "Green Road". */
  name: string;
  /** Full address as returned by the geocoder. */
  address: string;
  lat: number;
  lng: number;
}

export const DEFAULT_LOCATION: PlaceSuggestion = {
  id: 'default',
  name: process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? 'Green Road, Dhaka',
  address: process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? 'Green Road, Dhaka',
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 23.7509),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? 90.3854),
};

const STORAGE_KEY = 'onetap.location.v1';

export function loadLocation(): PlaceSuggestion {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlaceSuggestion) : DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}

/**
 * True when the visitor actively chose a location, as opposed to falling back
 * to the built-in default. Callers use this to decide whether the chosen place
 * should override a saved profile address at checkout — an explicitly picked
 * address is the one the service must go to.
 */
export function hasPickedLocation(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveLocation(place: PlaceSuggestion): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
  } catch {
    // Ignore quota/security errors.
  }
}

/** True when a Mapbox token is configured; callers can hide search without one. */
export const GEOCODING_ENABLED = Boolean(TOKEN);

/**
 * Address autocomplete. Matches on any part of the typed text and returns every
 * candidate the geocoder knows, biased to Bangladesh and proximate to the
 * default location so nearby streets rank first.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const term = query.trim();
  if (!TOKEN || term.length < 2) return [];

  // Providers in order of local accuracy: Barikoi (Bangladesh-specific),
  // then Google, then Mapbox. The first one to return anything wins.
  if (BARIKOI_KEY) {
    const viaBarikoi = await barikoiPlaces(term, signal).catch(() => []);
    if (viaBarikoi.length > 0) return viaBarikoi;
  }

  if (GOOGLE_KEY) {
    const viaGoogle = await googlePlaces(term, signal).catch(() => []);
    if (viaGoogle.length > 0) return viaGoogle;
  }

  const viaSearchBox = await searchBox(term, signal).catch(() => []);
  if (viaSearchBox.length > 0) return viaSearchBox;
  return legacyGeocode(term, signal).catch(() => []);
}

interface BarikoiPlace {
  id?: number | string;
  address?: string;
  area?: string;
  city?: string;
  postCode?: number | string;
  longitude?: number | string;
  latitude?: number | string;
}

/** Barikoi autocomplete — returns coordinates inline, so no second call. */
async function barikoiPlaces(term: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const url =
    `https://barikoi.xyz/v2/api/search/autocomplete/${encodeURIComponent(BARIKOI_KEY)}/place` +
    `?q=${encodeURIComponent(term)}`;

  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const data = (await response.json()) as { places?: BarikoiPlace[] };

  return (data.places ?? [])
    .map((p, index) => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const area = [p.area, p.city].filter(Boolean).join(', ');
      return {
        id: `bk:${p.id ?? index}`,
        name: p.address ?? area ?? term,
        address: [p.address, area, p.postCode].filter(Boolean).join(', '),
        lat,
        lng,
      } satisfies PlaceSuggestion;
    })
    .filter((p): p is PlaceSuggestion => p !== null);
}

interface GooglePrediction {
  placePrediction?: {
    placeId: string;
    text?: { text?: string };
    structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
  };
}

/** Places Autocomplete (New) + a Place Details call to resolve coordinates. */
async function googlePlaces(term: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
    },
    body: JSON.stringify({
      input: term,
      includedRegionCodes: ['bd'],
      locationBias: {
        circle: {
          center: { latitude: DEFAULT_LOCATION.lat, longitude: DEFAULT_LOCATION.lng },
          radius: 50000,
        },
      },
    }),
  });
  if (!response.ok) return [];

  const data = (await response.json()) as { suggestions?: GooglePrediction[] };
  const predictions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<GooglePrediction['placePrediction']> => Boolean(p?.placeId))
    .slice(0, 8);

  const resolved = await Promise.all(
    predictions.map(async (p) => {
      try {
        const r = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(p.placeId)}` +
            '?fields=location,formattedAddress,displayName',
          { signal, headers: { 'X-Goog-Api-Key': GOOGLE_KEY } },
        );
        if (!r.ok) return null;
        const detail = (await r.json()) as {
          location?: { latitude: number; longitude: number };
          formattedAddress?: string;
          displayName?: { text?: string };
        };
        if (!detail.location) return null;
        return {
          id: `g:${p.placeId}`,
          name: p.structuredFormat?.mainText?.text ?? detail.displayName?.text ?? p.text?.text ?? term,
          address: detail.formattedAddress ?? p.text?.text ?? term,
          lat: detail.location.latitude,
          lng: detail.location.longitude,
        } satisfies PlaceSuggestion;
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((r): r is PlaceSuggestion => r !== null);
}

/** Stable per-tab token — Mapbox groups suggest+retrieve calls by session. */
function sessionToken(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'onetap.mapbox.session';
  let token = window.sessionStorage.getItem(key);
  if (!token) {
    token = `s-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    window.sessionStorage.setItem(key, token);
  }
  return token;
}

interface SearchBoxSuggestion {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  full_address?: string;
}

async function searchBox(term: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const session = sessionToken();
  const url =
    'https://api.mapbox.com/search/searchbox/v1/suggest' +
    `?q=${encodeURIComponent(term)}` +
    `&access_token=${encodeURIComponent(TOKEN)}` +
    `&session_token=${encodeURIComponent(session)}` +
    '&limit=10&language=en' +
    `&proximity=${DEFAULT_LOCATION.lng},${DEFAULT_LOCATION.lat}` +
    // A bbox keeps results local; the country filter returns nothing here.
    '&bbox=88.0,20.5,92.7,26.7';

  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const data = (await response.json()) as { suggestions?: SearchBoxSuggestion[] };
  const suggestions = (data.suggestions ?? []).filter((s) => {
    // The bbox is advisory, so drop anything clearly outside Bangladesh.
    const where = `${s.place_formatted ?? ''} ${s.full_address ?? ''}`.toLowerCase();
    return !where || where.includes('bangladesh') || !/india|pakistan|united kingdom|nepal/.test(where);
  });

  // Coordinates require a retrieve call per suggestion; do them in parallel.
  const resolved = await Promise.all(
    suggestions.slice(0, 8).map(async (s) => {
      try {
        const r = await fetch(
          'https://api.mapbox.com/search/searchbox/v1/retrieve/' +
            `${encodeURIComponent(s.mapbox_id)}?access_token=${encodeURIComponent(TOKEN)}` +
            `&session_token=${encodeURIComponent(session)}`,
          { signal },
        );
        if (!r.ok) return null;
        const detail = (await r.json()) as {
          features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
        };
        const coords = detail.features?.[0]?.geometry?.coordinates;
        if (!coords) return null;
        return {
          id: s.mapbox_id,
          name: s.name,
          address: s.full_address ?? [s.name, s.place_formatted].filter(Boolean).join(', '),
          lng: coords[0],
          lat: coords[1],
        } satisfies PlaceSuggestion;
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((r): r is PlaceSuggestion => r !== null);
}

/** Legacy geocoder — fewer results, but it answers when Search Box does not. */
async function legacyGeocode(term: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json` +
    `?access_token=${encodeURIComponent(TOKEN)}` +
    '&autocomplete=true&limit=10&language=en' +
    (COUNTRY ? `&country=${encodeURIComponent(COUNTRY)}` : '') +
    `&proximity=${DEFAULT_LOCATION.lng},${DEFAULT_LOCATION.lat}`;

  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    features?: Array<{ id: string; text: string; place_name: string; center: [number, number] }>;
  };

  return (data.features ?? []).map((f) => ({
    id: f.id,
    name: f.text,
    address: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));
}

/** Barikoi reverse geocode — best local naming for a dropped pin. */
async function barikoiReverse(lat: number, lng: number): Promise<PlaceSuggestion | null> {
  const url =
    `https://barikoi.xyz/v2/api/search/reverse/geocode/${encodeURIComponent(BARIKOI_KEY)}` +
    `?longitude=${lng}&latitude=${lat}&district=true&post_code=true&country=true&sub_district=true&union=true&pauroshova=true&location_type=true&division=true&address=true&area=true`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as { place?: { address?: string; area?: string; city?: string } };
  const place = data.place;
  if (!place?.address) return null;
  return {
    id: 'bk:reverse',
    name: place.address,
    address: [place.address, place.area, place.city].filter(Boolean).join(', '),
    lat,
    lng,
  };
}

/** Resolve the browser's coordinates to an address ("use my location"). */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<PlaceSuggestion | null> {
  // Prefer the local provider's naming when it is configured.
  if (BARIKOI_KEY) {
    const local = await barikoiReverse(lat, lng).catch(() => null);
    if (local) return local;
  }

  if (!TOKEN) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${encodeURIComponent(TOKEN)}&limit=1&language=en`;

  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    features?: Array<{ id: string; text: string; place_name: string }>;
  };
  const first = data.features?.[0];
  if (!first) return null;

  return { id: first.id, name: first.text, address: first.place_name, lat, lng };
}
