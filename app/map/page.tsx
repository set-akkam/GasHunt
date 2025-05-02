/**
 * Map Page Component
 * Displays an interactive map showing fuel stations and their prices.
 * Features:
 * - Real-time station data fetching
 * - Geolocation support
 * - Interactive station markers
 * - Fallback test data for development
 */
"use client";
import { useState, useEffect, JSX } from "react";
import "leaflet/dist/leaflet.css";
import { useRouter } from 'next/navigation';
import { useAuth } from "../providers/AuthProvider";
import dynamic from 'next/dynamic';
import type { StationWithPrices } from "@/types/station";
import { handleApiResponse } from "../utils/api";

/**
 * Default center coordinates (Dublin)
 * Used as fallback when geolocation fails
 */
const DUBLIN_CENTER: [number, number] = [53.349805, -6.26031];

/**
 * Map container styling
 * Ensures proper map dimensions and positioning
 */
const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 64px)", // Account for navbar height
  position: "relative" as const // Required for map overlay elements
};

/**
 * Test data for development and testing
 * Provides realistic station data when backend is not available
 */
const TEST_STATIONS: StationWithPrices[] = [
  {
    _id: "test1",
    stationId: "1",
    name: "Test Station Dublin City",
    location: {
      lat: 53.349805,
      lng: -6.26031
    },
    address: "O'Connell Street, Dublin",
    link: "https://example.com/station1",
    phone: "+353 1 234 5678",
    google_maps: "https://maps.google.com/?q=53.349805,-6.26031",
    opening_hours: {
      Monday: "24 hours",
      Tuesday: "24 hours",
      Wednesday: "24 hours",
      Thursday: "24 hours",
      Friday: "24 hours",
      Saturday: "24 hours",
      Sunday: "24 hours"
    },
    prices: {
      diesel: { price: 1.89, updatedAt: new Date().toISOString() },
      petrol: { price: 1.99, updatedAt: new Date().toISOString() }
    },
    services: ["shop", "car_wash", "air"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "test2",
    stationId: "2",
    name: "Test Station Phoenix Park",
    location: {
      lat: 53.3568,
      lng: -6.3185
    },
    address: "Phoenix Park, Dublin",
    link: "https://example.com/station2",
    phone: "+353 1 234 5679",
    google_maps: "https://maps.google.com/?q=53.3568,-6.3185",
    opening_hours: {
      Monday: "06:00-23:00",
      Tuesday: "06:00-23:00",
      Wednesday: "06:00-23:00",
      Thursday: "06:00-23:00",
      Friday: "06:00-23:00",
      Saturday: "07:00-23:00",
      Sunday: "08:00-22:00"
    },
    prices: {
      diesel: { price: 1.85, updatedAt: new Date().toISOString() },
      petrol: { price: 1.95, updatedAt: new Date().toISOString() }
    },
    services: ["shop", "ev_charging"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: "test3",
    stationId: "3",
    name: "Test Station Dublin Airport",
    location: {
      lat: 53.4213,
      lng: -6.2700
    },
    address: "Dublin Airport, Co. Dublin",
    link: "https://example.com/station3",
    phone: "+353 1 234 5680",
    google_maps: "https://maps.google.com/?q=53.4213,-6.2700",
    opening_hours: {
      Monday: "24 hours",
      Tuesday: "24 hours",
      Wednesday: "24 hours",
      Thursday: "24 hours",
      Friday: "24 hours",
      Saturday: "24 hours",
      Sunday: "24 hours"
    },
    prices: {
      diesel: { price: 1.92, updatedAt: new Date().toISOString() },
      petrol: { price: 2.02, updatedAt: new Date().toISOString() }
    },
    services: ["shop", "food", "atm"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Dynamic import of the Map component
 * Prevents SSR issues with Leaflet which requires window object
 */
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  ),
});

/**
 * Map component wrapper
 * Ensures the map is only rendered client-side
 */
const MapWrapper = (props: any) => {
  if (typeof window === 'undefined') return null;
  return <Map {...props} />;
};

export default function MapPage(): JSX.Element {
  // State and hooks
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationWithPrices | null>(null);
  const [useTestData, setUseTestData] = useState(false);

  /**
   * Fetches station data from the API or uses test data
   * Attempts to use user's location, falls back to Dublin center
   * Handles various error cases and provides detailed logging
   */
  const fetchStations = async () => {
    try {
      if (useTestData) {
        console.log('Using test stations data');
        setStations(TEST_STATIONS);
        setIsLoading(false);
        return;
      }

      // Get user's current location or use Dublin center
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      }).catch(() => {
        // If geolocation fails, use Dublin center
        console.log('Using default Dublin center:', DUBLIN_CENTER);
        return { 
          coords: { 
            latitude: DUBLIN_CENTER[0], 
            longitude: DUBLIN_CENTER[1] 
          } 
        };
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      console.log('\n=== Fetching Stations ===');
      console.log('Search coordinates:', { lat, lng });
      console.log('Distance from Dublin center:', 
        calculateDistance(
          lat, 
          lng, 
          DUBLIN_CENTER[0], 
          DUBLIN_CENTER[1]
        ).toFixed(2), 
        'km'
      );

      // Always use Dublin center for testing until we confirm it works
      const searchLat = DUBLIN_CENTER[0];
      const searchLng = DUBLIN_CENTER[1];
      console.log('Using search location:', { lat: searchLat, lng: searchLng });

      // Fetch nearby stations from our backend
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stations/nearby?lat=${searchLat}&lng=${searchLng}&radius=5000`;
      console.log('API URL:', apiUrl);
      console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

      console.log('Making API request...');
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json'
          },
          // Add mode and credentials for better error handling
          mode: 'cors',
          credentials: 'include'
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response status text:', response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await handleApiResponse(response);
        console.log('\nAPI Response data:', data);
        
        if (!Array.isArray(data)) {
          console.error('API response is not an array:', data);
          throw new Error("Invalid response format");
        }
        
        // Transform the data to match the StationWithPrices interface
        const transformedStations = data.map((station: any) => ({
          ...station,
          stationId: station.stationId || station.stationid,
          location: station.location || {
            lat: station.latitude,
            lng: station.longitude
          },
          prices: {
            diesel: station.prices?.diesel || { price: 0, updatedAt: new Date().toISOString() },
            petrol: station.prices?.petrol || { price: 0, updatedAt: new Date().toISOString() }
          }
        }));

        console.log('\nTransformed stations:', transformedStations);
        console.log('Number of stations:', transformedStations.length);

        setStations(transformedStations);
      } catch (error) {
        console.error('Error fetching stations:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        setError("Failed to load fuel stations");
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      setError("Failed to load fuel stations");
    }
  };

  // Helper function to calculate distance between coordinates in kilometers
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI/180);
  }

  useEffect(() => {
    fetchStations();
  }, [useTestData]);

  // Debug display for stations
  useEffect(() => {
    if (stations.length > 0) {
      console.log('Current stations in state:', stations);
    }
  }, [stations]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={fetchStations}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {isLoading ? (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="h-[calc(100vh-64px)] relative">
          <MapWrapper
            center={DUBLIN_CENTER}
            zoom={12}
            stations={stations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            router={router}
          />
          {/* Debug overlay */}
          {/* <div className="absolute top-4 right-4 bg-white p-4 rounded shadow-lg z-[1000] max-w-sm max-h-96 overflow-auto">
            <h3 className="font-bold mb-2">Debug Info</h3>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={useTestData}
                  onChange={(e) => setUseTestData(e.target.checked)}
                  className="mr-2"
                />
                Use Test Data
              </label>
            </div>
            <p>Stations loaded: {stations.length}</p>
            <p className="text-xs text-gray-600 mb-2">
              {useTestData ? 'Using test data' : 'Using real data'}
            </p>
            <button 
              onClick={() => console.log('Current stations:', stations)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Log stations to console
            </button>
            {stations.length === 0 && (
              <p className="text-red-600 mt-2">No stations found in this area</p>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}
