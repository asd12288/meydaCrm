'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icon using inline SVG (avoids issues with bundled marker images)
const markerIcon = new L.DivIcon({
  className: 'custom-map-marker',
  html: `<svg viewBox="0 0 24 24" width="32" height="32" fill="#5D87FF">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LeafletMapProps {
  lat: number;
  lng: number;
  address: string;
  zoom?: number;
}

/**
 * Leaflet map component displaying a location marker.
 * Must be loaded client-side only (use dynamic import with ssr: false).
 */
export function LeafletMap({ lat, lng, address, zoom = 15 }: LeafletMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '200px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>
          <span className="text-sm">{address}</span>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
