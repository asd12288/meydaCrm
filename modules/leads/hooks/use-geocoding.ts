'use client';

import { useState, useEffect, useMemo } from 'react';

interface GeocodingResult {
  lat: number;
  lng: number;
  isLoading: boolean;
  error: string | null;
}

interface CacheEntry {
  lat: number;
  lng: number;
  timestamp: number;
}

const CACHE_PREFIX = 'geocode:';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Simple hash function for cache key generation
 */
function hashAddress(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Try to get cached coordinates from localStorage
 */
function getCachedCoordinates(fullAddress: string): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = CACHE_PREFIX + hashAddress(fullAddress);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return { lat: entry.lat, lng: entry.lng };
      }
    }
  } catch {
    // localStorage not available or parse error
  }
  return null;
}

/**
 * Save coordinates to localStorage cache
 */
function cacheCoordinates(fullAddress: string, lat: number, lng: number): void {
  try {
    const cacheKey = CACHE_PREFIX + hashAddress(fullAddress);
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ lat, lng, timestamp: Date.now() })
    );
  } catch {
    // localStorage not available
  }
}

/**
 * Hook to geocode an address using Nominatim (OpenStreetMap's free geocoding service).
 * Caches results in localStorage to avoid repeated API calls.
 */
export function useGeocoding(
  address: string | null,
  city: string | null,
  postalCode: string | null,
  country: string | null
): GeocodingResult {
  // Build full address string (memoized)
  const fullAddress = useMemo(
    () => [address, postalCode, city, country].filter(Boolean).join(', '),
    [address, city, postalCode, country]
  );

  // Determine initial state: check cache synchronously
  const [result, setResult] = useState<GeocodingResult>(() => {
    // No address - return empty result immediately
    if (!fullAddress) {
      return { lat: 0, lng: 0, isLoading: false, error: null };
    }

    // Check cache synchronously during initialization
    const cached = getCachedCoordinates(fullAddress);
    if (cached) {
      return { ...cached, isLoading: false, error: null };
    }

    // Has address but not cached - start in loading state
    return { lat: 0, lng: 0, isLoading: true, error: null };
  });

  useEffect(() => {
    // No address provided - nothing to geocode
    if (!fullAddress) {
      return;
    }

    // Check if we already have valid coordinates (from cache during init)
    if (result.lat !== 0 || result.lng !== 0) {
      return;
    }

    // Fetch from Nominatim
    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`,
      {
        headers: { 'User-Agent': 'PulseCRM/1.0' },
        signal: controller.signal,
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          // Cache result in localStorage
          cacheCoordinates(fullAddress, lat, lng);

          setResult({ lat, lng, isLoading: false, error: null });
        } else {
          setResult({
            lat: 0,
            lng: 0,
            isLoading: false,
            error: 'Adresse non trouvée',
          });
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setResult({
            lat: 0,
            lng: 0,
            isLoading: false,
            error: 'Erreur de géocodage',
          });
        }
      });

    return () => controller.abort();
  }, [fullAddress, result.lat, result.lng]);

  return result;
}
