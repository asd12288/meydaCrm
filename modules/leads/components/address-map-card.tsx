'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGeocoding } from '../hooks/use-geocoding';

// Dynamic import with SSR disabled (Leaflet requires window object)
const LeafletMap = dynamic(
  () => import('./leaflet-map').then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => <div className="address-map-skeleton" />,
  }
);

interface AddressMapCardProps {
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

/**
 * Address map card that geocodes and displays a location on a map.
 * Handles SSR by dynamically importing the Leaflet component.
 * Silently hides if no address or geocoding fails.
 */
export function AddressMapCard({
  address,
  city,
  postalCode,
  country,
}: AddressMapCardProps) {
  // Track if we're mounted to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  const { lat, lng, isLoading, error } = useGeocoding(
    address,
    city,
    postalCode,
    country
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: triggers re-render after hydration to prevent mismatch
    setIsMounted(true);
  }, []);

  // Don't render if no address data
  if (!address && !city && !postalCode) {
    return null;
  }

  // Always show skeleton on server and during initial client render
  // This ensures consistent HTML between server and client
  if (!isMounted || isLoading) {
    return <div className="address-map-skeleton" />;
  }

  // Error state or no coordinates - silently fail
  if (error || (lat === 0 && lng === 0)) {
    return null;
  }

  // Build full address for popup
  const fullAddress = [address, postalCode, city, country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="address-map-container">
      <LeafletMap lat={lat} lng={lng} address={fullAddress} />
    </div>
  );
}
