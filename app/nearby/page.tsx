"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaGasPump, FaClock, FaFilter } from 'react-icons/fa';
import Link from 'next/link';
import type { StationWithPrices } from '@/types/station';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import React from 'react';

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  ),
});

// Create a stable wrapper component outside the main component to avoid re-creation
const StableMapWrapper = React.memo((props: any) => {
  // Only render on client side
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return <Map {...props} />;
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if essential props have changed
  return (
    prevProps.center[0] === nextProps.center[0] &&
    prevProps.center[1] === nextProps.center[1] &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.searchRadius === nextProps.searchRadius &&
    prevProps.selectedStation?.stationId === nextProps.selectedStation?.stationId &&
    prevProps.stations.length === nextProps.stations.length
  );
});

const RADIUS_OPTIONS = [
  { value: 5000, label: '5km' },
  { value: 10000, label: '10km' },
  { value: 15000, label: '15km' },
];

export default function NearbyStationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [allStations, setAllStations] = useState<StationWithPrices[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationWithPrices | null>(null);
  const [selectedRadius, setSelectedRadius] = useState(5000);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const DEFAULT_LOCATION = { lat: 53.3498, lng: -6.2603 }; // Dublin city center as default
  const [displayedStations, setDisplayedStations] = useState<StationWithPrices[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isViewportFetching, setIsViewportFetching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Initial location fetch
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false, // Start with lower accuracy for faster response
              timeout: 20000, // Increased timeout
              maximumAge: 30000 // Allow cached positions up to 30 seconds old
            }
          );
        });

        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userLoc);
        setMapCenter([userLoc.lat, userLoc.lng]);
        setRetryCount(0); // Reset retry count on success
        await fetchStations(userLoc);
      } catch (error) {
        console.error('Location fetch error:', error);
        
        // If we haven't exceeded max retries, try again with different settings
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Try again with different settings
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setUserLocation(userLoc);
              setMapCenter([userLoc.lat, userLoc.lng]);
              fetchStations(userLoc);
            },
            (retryError) => {
              handleLocationError(retryError);
              // Fall back to default location after all retries
              if (retryCount === MAX_RETRIES - 1) {
                console.log('Falling back to default location');
                setUserLocation(DEFAULT_LOCATION);
                setMapCenter([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
                fetchStations(DEFAULT_LOCATION);
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0
            }
          );
        } else {
          handleLocationError(error);
          // Use default location as fallback
          console.log('Using default location after all retries failed');
          setUserLocation(DEFAULT_LOCATION);
          setMapCenter([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
          fetchStations(DEFAULT_LOCATION);
        }
      }
    };

    getInitialLocation();
  }, [retryCount]); // Add retryCount as dependency

  // Continuous location tracking with improved error handling
  useEffect(() => {
    if (!userLocation) return;

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const newUserLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Only update if location has changed significantly (more than 10 meters)
        if (calculateDistance(
          userLocation.lat,
          userLocation.lng,
          newUserLoc.lat,
          newUserLoc.lng
        ) > 0.01) {
          setUserLocation(newUserLoc);
          setMapCenter([newUserLoc.lat, newUserLoc.lng]);
          await fetchStations(newUserLoc);
        }
      },
      (error) => {
        console.warn('Watch position error:', error);
        // Don't show error message for watch position errors
        // Just keep using the last known good location
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000 // Allow some caching for continuous updates
      }
    );

    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [userLocation]);

  const handleLocationError = (error: any) => {
    console.error('Location error:', error);
    let errorMessage = 'An error occurred while getting your location.';
    
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Unable to determine your location. Please check your device settings.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please check your internet connection.';
          break;
      }
    }
    
    setLocationError(errorMessage);
    toast.error(errorMessage);
  };

  // Update the Try Again button handler
  const handleRetryLocation = () => {
    setLocationError(null);
    setRetryCount(0); // Reset retry count
    setIsLoading(true);
    
    // Try to get location again
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userLoc);
        setMapCenter([userLoc.lat, userLoc.lng]);
        fetchStations(userLoc);
      },
      (error) => {
        handleLocationError(error);
        // Fall back to default location
        setUserLocation(DEFAULT_LOCATION);
        setMapCenter([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
        fetchStations(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  // Fetch stations based on viewport bounds
  const fetchStationsInViewport = useCallback(async (bounds: L.LatLngBounds) => {
    if (!userLocation || isViewportFetching) return;
    
    setIsViewportFetching(true);
    try {
      // Extract bounds coordinates
      const north = bounds.getNorth();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      
      console.log(`Fetching stations within viewport: N:${north}, E:${east}, S:${south}, W:${west}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stations/nearby?` +
        `lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${selectedRadius}` +
        `&bounds=${north},${east},${south},${west}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stations in viewport');
      }

      const data = await response.json();
      
      // Transform and sort stations
      const transformedStations = data.map((station: any) => ({
        ...station,
        stationId: station.stationId || station.stationid,
        location: station.location || {
          lat: station.latitude,
          lng: station.longitude
        },
        prices: station.prices || {}
      }));

      // Sort stations by distance
      const sortedStations = transformedStations.sort((a: StationWithPrices, b: StationWithPrices) => {
        return (a.distance || 0) - (b.distance || 0);
      });

      console.log(`Fetched ${sortedStations.length} stations within viewport bounds`);
      
      // Only update stations if we actually got data
      if (sortedStations.length > 0) {
        setStations(sortedStations);
      } else {
        // If no stations were returned, keep the existing stations
        console.log('No stations returned from viewport fetch. Keeping existing stations.');
      }
    } catch (error) {
      console.error('Error fetching stations in viewport:', error);
      // Fallback to all stations if viewport fetching fails
    } finally {
      setIsViewportFetching(false);
    }
  }, [userLocation, isViewportFetching, selectedRadius]);

  // Use a memoized handler for map load to prevent re-renders
  const handleMapLoad = useCallback((map: L.Map) => {
    setMapInstance(map);
  }, []);

  // Handle viewport changes with a memoized callback
  const handleViewportChange = useCallback((bounds: L.LatLngBounds) => {
    fetchStationsInViewport(bounds);
  }, [fetchStationsInViewport]);

  // Fetch stations with location
  const fetchStations = async (location: { lat: number; lng: number }) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stations/nearby?` +
        `lat=${location.lat}&lng=${location.lng}&radius=${selectedRadius}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby stations');
      }

      const data = await response.json();
      
      // Transform and sort stations
      const transformedStations = data.map((station: any) => ({
        ...station,
        stationId: station.stationId || station.stationid,
        location: station.location || {
          lat: station.latitude,
          lng: station.longitude
        },
        prices: station.prices || {}
      }));

      // Sort stations by distance
      const sortedStations = transformedStations.sort((a: StationWithPrices, b: StationWithPrices) => {
        return (a.distance || 0) - (b.distance || 0);
      });

      // Always update allStations
      setAllStations(sortedStations);
      
      // Only update the stations state if we actually got data
      // This prevents empty arrays from clearing the list
      if (sortedStations.length > 0) {
        setStations(sortedStations);
        console.log(`Updated stations list with ${sortedStations.length} stations`);
      } else {
        // If no stations were returned, keep the existing stations
        console.log('No stations returned from fetch. Keeping existing stations.');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      toast.error('Failed to fetch nearby stations');
    } finally {
      setIsLoading(false);
    }
  };

  // Update stations when radius changes
  useEffect(() => {
    if (userLocation) {
      fetchStations(userLocation);
    }
  }, [selectedRadius]);

  // Update displayed stations when all stations or display count changes
  useEffect(() => {
    setDisplayedStations(stations.slice(0, displayCount));
  }, [stations, displayCount]);

  const loadMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  // Helper function to zoom to station
  const handleStationClick = (station: StationWithPrices) => {
    setSelectedStation(station);
    if (mapInstance) {
      mapInstance.setView([station.location.lat, station.location.lng], 15);
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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Show map after a slight delay to ensure DOM is ready
  useEffect(() => {
    if (mapCenter) {
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapCenter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding stations near you...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <FaMapMarkerAlt className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Error</h2>
          <p className="text-gray-600 mb-6">{locationError}</p>
          
          {locationError.includes('permission denied') && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                To enable location access:
              </p>
              <div className="space-y-2 text-sm text-left mb-6">
                <p className="font-medium">Windows:</p>
                <a
                  href="ms-settings:privacy-location"
                  className="text-blue-600 hover:text-blue-800 underline block ml-4"
                >
                  → Open Location Settings
                </a>
                <p className="font-medium mt-4">Chrome:</p>
                <ol className="list-decimal ml-8 space-y-1 text-gray-600">
                  <li>Click the lock icon in the address bar</li>
                  <li>Select "Site settings"</li>
                  <li>Allow location access</li>
                </ol>
                <p className="font-medium mt-4">Other Browsers:</p>
                <ol className="list-decimal ml-8 space-y-1 text-gray-600">
                  <li>Open browser settings</li>
                  <li>Search for "Location" or "Site permissions"</li>
                  <li>Allow location access for this site</li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRetryLocation}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/map"
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Map Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content container */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        {/* Best Prices Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Best Prices</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { display: 'Diesel', key: 'DIESEL' },
              { display: 'Petrol', key: 'PETROL' },
              { display: 'Premium Diesel', key: 'DIESEL_PREMIUM' },
              { display: 'Premium Petrol', key: 'PETROL_PREMIUM' }
            ].map(({ display, key }) => {
              const stationsWithFuel = stations.filter(station => {
                const hasPrice = station.prices?.[key]?.price && !isNaN(Number(station.prices[key].price));
                console.log(`Checking station ${station.name} for ${key}:`, hasPrice, station.prices?.[key]?.price);
                return hasPrice;
              });
              
              console.log(`Found ${stationsWithFuel.length} stations with ${key}`);
              
              const bestStation = stationsWithFuel.length > 0 
                ? stationsWithFuel.reduce((prev, curr) => {
                    const prevPrice = Number(prev.prices?.[key]?.price ?? Infinity);
                    const currPrice = Number(curr.prices?.[key]?.price ?? Infinity);
                    console.log(`Comparing prices for ${key}:`, prevPrice, currPrice);
                    return currPrice < prevPrice ? curr : prev;
                  })
                : null;

              return (
                <div key={key} 
                  className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => bestStation && setSelectedStation(bestStation)}
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">{display}</h3>
                  {bestStation && bestStation.prices?.[key]?.price ? (
                    <div>
                      <p className="text-green-600 font-bold text-xl">
                        €{Number(bestStation.prices[key].price).toFixed(3)}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{bestStation.name}</p>
                      <p className="text-xs text-gray-500">
                        {bestStation.distance ? `${(bestStation.distance / 1000).toFixed(1)}km away` : ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No prices available</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stations and Map Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stations List Section - Now First */}
          <div className="lg:col-span-1 w-full order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Nearby Stations</h1>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={selectedRadius}
                    onChange={(e) => setSelectedRadius(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {RADIUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <p>Showing stations within {selectedRadius / 1000}km</p>
                <p>{stations.length} stations found</p>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {displayedStations.map((station) => (
                  <div
                    key={station.stationId}
                    className={`p-4 rounded-lg border ${
                      selectedStation?.stationId === station.stationId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } cursor-pointer transition-colors`}
                    onClick={() => handleStationClick(station)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{station.name}</h3>
                      <span className="text-sm text-gray-500">
                        {station.distance ? `${(station.distance / 1000).toFixed(1)}km` : ''}
                      </span>
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div>
                          {station.prices && Object.entries(station.prices).length > 0 ? (
                            <div className="flex flex-col xs:grid xs:grid-cols-2 sm:gap-2 gap-1.5">
                              {Object.entries(station.prices).map(([type, data]) => (
                                <div 
                                  key={`${station.stationId}-${type}`} 
                                  className="flex items-center gap-1.5 whitespace-nowrap text-[13px] sm:text-sm py-0.5"
                                >
                                  <span className="text-gray-600 capitalize min-w-[90px]">{type.replace(/_/g, ' ').toLowerCase()}:</span>
                                  <span className="font-semibold">
                                    {data && data.price ? `€${Number(data.price).toFixed(3)}` : 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No price information available</p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/station?id=${station.stationId}&name=${encodeURIComponent(station.name)}`}
                        className="text-blue-600 hover:text-blue-800 ml-4"
                        onClick={(e) => e.stopPropagation()} // Prevent station click when clicking pump icon
                      >
                        <FaGasPump className="text-xl" />
                      </Link>
                    </div>

                    {station.prices && Object.entries(station.prices).length > 0 && (
                      <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <FaClock className="text-gray-400" />
                          Last updated: {
                            Object.values(station.prices).some(p => p?.updatedAt)
                              ? new Date(
                                  Object.values(station.prices).find(p => p?.updatedAt)?.updatedAt || new Date()
                                ).toLocaleString('en-IE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })
                              : 'N/A'
                          }
                        </p>
                        <a
                          href={`https://www.google.com/maps/dir//${station.location.lat},${station.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#4285F4] hover:text-[#1967D2] bg-white hover:bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 transition-colors w-fit"
                        >
                          <FaMapMarkerAlt className="text-[#DB4437]" />
                          Open in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                ))}

                {displayedStations.length < stations.length && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={loadMore}
                      className="px-6 py-2 bg-[#2ecf77] text-white rounded-lg hover:bg-[#25a861] transition-colors font-medium text-sm shadow-sm"
                    >
                      Load More Stations
                    </button>
                  </div>
                )}

                {stations.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No stations found within {selectedRadius / 1000}km. Try increasing the radius.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Section - Now Second */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden order-1 lg:order-2 flex flex-col">
            <div className="flex-grow h-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] relative">
              {mapCenter && showMap && (
                <StableMapWrapper
                  key={`map-${mapCenter[0].toFixed(4)}-${mapCenter[1].toFixed(4)}-${selectedRadius}`}
                  center={mapCenter}
                  zoom={13}
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  router={router}
                  userLocation={userLocation || undefined}
                  searchRadius={selectedRadius}
                  onMapLoad={handleMapLoad}
                  onViewportChange={handleViewportChange}
                />
              )}
              {(!mapCenter || !showMap) && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 