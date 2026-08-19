'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Minus, Plus } from 'lucide-react';
import { MAP_TOKEN } from '@/app/lib/location';

export function MapPreview({
  lat,
  lng,
  label,
  zoom = 15,
  height = 200,
  className = '',
  interactive = true,
  onPick,
  onZoom,
}: {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number;
  height?: number;
  className?: string;
  /** Whether the map allows pan/drag/zoom interaction. Default is true. */
  interactive?: boolean;
  /** Enables click/drag to place. Receives the coordinates under the marker. */
  onPick?: (lat: number, lng: number) => void;
  /** Enables the zoom update callback. */
  onZoom?: (zoom: number) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!MAP_TOKEN || !mapContainerRef.current || !interactive) return;

    try {
      mapboxgl.accessToken = MAP_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom,
        interactive: true,
        attributionControl: false,
      });

      mapRef.current = map;

      // Add draggable Marker if onPick is present
      const marker = new mapboxgl.Marker({
        color: '#f97316',
        draggable: Boolean(onPick),
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = marker;

      if (onPick) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onPick(lngLat.lat, lngLat.lng);
        });

        map.on('click', (e) => {
          marker.setLngLat(e.lngLat);
          onPick(e.lngLat.lat, e.lngLat.lng);
        });
      }

      map.on('zoomend', () => {
        if (onZoom) {
          onZoom(Math.round(map.getZoom()));
        }
      });

      map.on('load', () => {
        map.resize();
      });

      map.on('error', (e) => {
        if (e.error?.message?.includes('WebGL')) {
          setWebglError(true);
        }
      });

      return () => {
        marker.remove();
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch (err) {
      console.warn('Mapbox GL error, falling back to static:', err);
      setWebglError(true);
    }
  }, [interactive]);

  // Update map center & marker when lat/lng props change from outside
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([lng, lat]);

    const currentCenter = mapRef.current.getCenter();
    const distance = Math.hypot(currentCenter.lng - lng, currentCenter.lat - lat);
    if (distance > 0.0001) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        essential: true,
      });
    }
  }, [lat, lng, zoom]);

  // Zoom buttons helper
  const handleZoom = (delta: number) => {
    if (mapRef.current) {
      const nextZoom = Math.min(18, Math.max(3, mapRef.current.getZoom() + delta));
      mapRef.current.zoomTo(nextZoom);
      onZoom?.(Math.round(nextZoom));
    }
  };

  // Missing token fallback
  if (!MAP_TOKEN) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-xs text-gray-500 ${className}`}
        style={{ height }}
      >
        <MapPin className="h-4 w-4 text-orange-500" />
        <span>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
        <span className="text-[10px]">Map preview needs NEXT_PUBLIC_MAPBOX_TOKEN</span>
      </div>
    );
  }

  // Static image fallback if interactive is false or WebGL failed
  if (!interactive || webglError) {
    const markerStr = `pin-s+f97316(${lng},${lat})`;
    const src =
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerStr}/` +
      `${lng},${lat},${zoom},0/600x${height}@2x?access_token=${MAP_TOKEN}`;

    return (
      <figure className={`relative overflow-hidden rounded-xl border border-gray-200 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label ? `Map showing ${label}` : 'Map of selected location'}
          width={600}
          height={height}
          className="block w-full object-cover"
          style={{ height }}
          loading="lazy"
        />
        {label && (
          <figcaption className="flex items-center gap-1.5 bg-white px-3 py-2 text-xs text-gray-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{label}</span>
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border shadow-inner ${className}`}>
      {/* Interactive Mapbox Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ height: `${height}px`, minHeight: '150px' }}
      />

      {/* Zoom Controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => handleZoom(1)}
          className="p-1.5 text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => handleZoom(-1)}
          className="border-t border-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Floating Hint */}
      {onPick && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/75 px-3 py-1 text-center text-[11px] font-medium text-white shadow">
          Drag map or marker to set location
        </div>
      )}

      {/* Label bar if provided and not picking */}
      {label && !onPick && (
        <div className="flex items-center gap-1.5 border-t border-border bg-background px-3 py-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
          <span className="truncate">{label}</span>
        </div>
      )}
    </div>
  );
}
