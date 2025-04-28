"use client";
import { useState, JSX } from "react";
import "leaflet/dist/leaflet.css";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import L from 'leaflet';

// Types
interface FuelStation {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  prices?: {
    diesel: number;
    petrol: number;
  };
}

// Test data
const testStations: FuelStation[] = [
  {
    id: "1",
    name: "CIRCLE K EXPRESS ROSCREA",
    location: { lat: 52.9465450, lng: -7.7970230 },
    address: "Roscrea, Co. Tipperary",
    prices: {
      diesel: 1.85,
      petrol: 2.05
    }
  },
  {
    id: "2",
    name: "CIRCLE K EXPRESS KILRUSH",
    location: { lat: 52.6418200, lng: -9.4806200 },
    address: "Kilrush, Co. Clare",
    prices: {
      diesel: 1.88,
      petrol: 2.08
    }
  },
];

// Ireland center coordinates
const IRELAND_CENTER: [number, number] = [53.4129, -8.2439];

// Marker icon
const fuelIcon = L.icon({
  iconUrl: "/fuel-marker.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Dynamically import map components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function TestMapPage(): JSX.Element {
  const router = useRouter();
  const [stations] = useState<FuelStation[]>(testStations);

  const handleStationClick = (station: FuelStation) => {
    router.push(
      `/station?id=${station.id}` +
      `&name=${encodeURIComponent(station.name)}`
    );
  };

  return (
    <div className="relative min-h-screen">
      <MapContainer 
        center={IRELAND_CENTER} 
        zoom={7} 
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.location.lat, station.location.lng]}
            icon={fuelIcon}
            eventHandlers={{
              click: () => handleStationClick(station)
            }}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-lg mb-2">{station.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{station.address}</p>
                {station.prices && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm">Diesel: €{station.prices.diesel}</p>
                    <p className="text-sm">Petrol: €{station.prices.petrol}</p>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleStationClick(station)}
                    className="w-full text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}