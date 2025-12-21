'use client';

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
  const { lat, lng, isLoading, error } = useGeocoding(
    address,
    city,
    postalCode,
    country
  );

  // Don't render if no address data
  if (!address && !city && !postalCode) {
    return null;
  }

  // Loading state
  if (isLoading) {
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
