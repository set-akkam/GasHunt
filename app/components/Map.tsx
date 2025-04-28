/**
 * Interactive Map Component
 * Displays fuel stations on a Leaflet map with clustering support.
 * Features:
 * - Custom markers for different station brands
 * - Marker clustering for better performance
 * - Search radius visualization
 * - Responsive map updates
 * - Station selection and details popup
 * - Optimized data fetching based on current map viewport bounds
 * - Debounced map move/zoom events to prevent excessive data re-fetching
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import type { StationWithPrices } from '@/types/station';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

/**
 * Type extension for Leaflet to support marker clustering
 * Adds missing types for the MarkerClusterGroup plugin
 */
declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    animate?: boolean;
    iconCreateFunction?: (cluster: any) => L.DivIcon;
  }

  class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    addLayers(layers: L.Layer[]): this;
    removeLayers(layers: L.Layer[]): this;
    clearLayers(): this;
  }

  namespace MarkerClusterGroup {
    function create(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
  }
}

// Fix Leaflet's default icon paths for Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
  });
}

// Add custom CSS for marker clusters
const clusterStyles = `
.marker-cluster-small {
  background-color: rgba(181, 226, 140, 0.6);
}
.marker-cluster-small div {
  background-color: rgba(110, 204, 57, 0.6);
}

.marker-cluster-medium {
  background-color: rgba(241, 211, 87, 0.6);
}
.marker-cluster-medium div {
  background-color: rgba(240, 194, 12, 0.6);
}

.marker-cluster-large {
  background-color: rgba(253, 156, 115, 0.6);
}
.marker-cluster-large div {
  background-color: rgba(241, 128, 23, 0.6);
}

.marker-cluster {
  background-clip: padding-box;
  border-radius: 20px;
}
.marker-cluster div {
  width: 30px;
  height: 30px;
  margin-left: 5px;
  margin-top: 5px;
  text-align: center;
  border-radius: 15px;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

/**
 * Props interface for the Map component
 */
interface MapProps {
  center: [number, number];          // Initial map center coordinates
  zoom: number;                      // Initial zoom level
  stations: StationWithPrices[];     // Array of fuel stations to display
  selectedStation: StationWithPrices | null;  // Currently selected station
  setSelectedStation: (station: StationWithPrices | null) => void;  // Station selection handler
  router: ReturnType<typeof useRouter>;  // Next.js router for navigation
  userLocation?: { lat: number; lng: number };  // User's current location
  searchRadius?: number;             // Search radius in meters
  onMapLoad?: (map: L.Map) => void; // Callback when map is loaded
  onViewportChange?: (bounds: L.LatLngBounds) => void; // Callback when viewport changes
}

/**
 * Map container styling
 * Ensures the map takes up the full container space
 */
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  position: "absolute" as const,
  top: 0,
  left: 0,
  zIndex: 1
};

// Define consistent icon size for all markers
const ICON_SIZE = 40;
const ICON_ANCHOR = ICON_SIZE / 2;

/**
 * Custom icons for different marker types
 * Includes brand-specific icons and user location marker
 */
const icons = {
  default: new L.Icon({
    iconUrl: "/marker-icon.png",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_ANCHOR, ICON_SIZE],
    popupAnchor: [0, -ICON_SIZE],
    className: 'station-marker'
  }),
  circlek: new L.Icon({
    iconUrl: "/circlek.png",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_ANCHOR, ICON_SIZE],
    popupAnchor: [0, -ICON_SIZE],
    className: 'station-marker'
  }),
  applegreen: new L.Icon({
    iconUrl: "/applegreen.png",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_ANCHOR, ICON_SIZE],
    popupAnchor: [0, -ICON_SIZE],
    className: 'station-marker'
  }),
  user: new L.Icon({
    iconUrl: "/location.jpeg",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: 'user-marker rounded-full border-2 border-white shadow-lg'
  }),
};

/**
 * Determines the appropriate icon for a station based on its brand name
 * Falls back to default icon if brand is not recognized
 */
const getStationIcon = (station: StationWithPrices) => {
  if (!station?.name) return icons.default;
  
  const stationName = station.name.toLowerCase();
  
  // Check for Circle K
  if (stationName.includes('circle k') || stationName.includes('circlek')) {
    return icons.circlek;
  }
  
  // Use Applegreen icon for any non-Circle K station
  return icons.applegreen;
};

/**
 * Creates a debounced version of a function
 * Prevents excessive function calls by waiting until a specified time has passed
 * since the last invocation before executing the function again.
 * 
 * This is specifically used to prevent excessive API calls when the map is being
 * moved or zoomed rapidly by the user.
 * 
 * @param func The function to debounce
 * @param wait The debounce wait time in milliseconds
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Custom hook to create and manage a Leaflet map instance
 * 
 * Key optimization features:
 * 1. Viewport-based data filtering - only displaying stations visible in the current view
 * 2. Debounced map events - preventing excessive API calls during map interaction
 * 3. Efficient marker clustering - grouping nearby stations for better performance
 */
function useLeafletMap({
  containerId,
  center,
  zoom,
  stations,
  selectedStation,
  searchRadius,
  userLocation,
  router,
  onMapLoad,
  onViewportChange
}: MapProps & { containerId: string }) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const [viewportStations, setViewportStations] = useState<StationWithPrices[]>(stations);
  
  // Create debounced viewport change handler
  // This prevents excessive API calls when the user is continuously moving the map
  const debouncedViewportChange = useCallback(
    debounce(() => {
      if (mapRef.current && onViewportChange) {
        const bounds = mapRef.current.getBounds();
        // This triggers the backend API call to get only stations within the current viewport
        onViewportChange(bounds);
      }
    }, 300), // 300ms debounce delay - wait until map movement has stopped for 300ms
    [onViewportChange]
  );
  
  // Initialize map
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') return;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Map container not found:', containerId);
      return;
    }
    
    // Check if map is already initialized
    if (mapRef.current) {
      console.log('Map already initialized, skipping initialization');
      return;
    }
    
    console.log('Initializing new map instance');
    
    // Create new map instance
    const map = L.map(container, {
      center,
      zoom,
      scrollWheelZoom: true
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    
    // Store the map reference
    mapRef.current = map;
    
    // Call onMapLoad callback
    if (onMapLoad) {
      onMapLoad(map);
    }
    
    // Add event listeners for viewport changes with debouncing
    if (onViewportChange) {
      map.on('moveend', debouncedViewportChange);
      map.on('zoomend', debouncedViewportChange);
      
      // Initial viewport notification to fetch data for the first view
      debouncedViewportChange();
    }
    
    // Add search radius visualization
    if (searchRadius) {
      circleRef.current = L.circle(center, {
        radius: searchRadius,
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(map);
    }
    
    // Add user location marker
    if (userLocation) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: icons.user })
        .bindPopup('<div class="text-center"><p class="font-semibold">Your Location</p></div>')
        .addTo(map);
    }
    
    // Create marker cluster group with visible styling
    clusterGroupRef.current = new L.MarkerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      animate: true,
      // Make sure clusters are visible
      iconCreateFunction: function(cluster) {
        const childCount = cluster.getChildCount();
        let c = ' marker-cluster-';
        
        if (childCount < 10) {
          c += 'small';
        } else if (childCount < 100) {
          c += 'medium';
        } else {
          c += 'large';
        }
        
        return new L.DivIcon({ 
          html: '<div><span>' + childCount + '</span></div>', 
          className: 'marker-cluster' + c, 
          iconSize: new L.Point(40, 40) 
        });
      }
    });
    
    map.addLayer(clusterGroupRef.current);
    
    // Clean up function
    return () => {
      console.log('Cleaning up map instance');
      
      if (mapRef.current) {
        // Remove event listeners
        mapRef.current.off('moveend', debouncedViewportChange);
        mapRef.current.off('zoomend', debouncedViewportChange);
        
        // Remove map
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      // Clear references
      markersRef.current = [];
      circleRef.current = null;
      userMarkerRef.current = null;
      clusterGroupRef.current = null;
    };
  }, [containerId]); // Only recreate map when containerId changes
  
  // Update map center and zoom when props change
  useEffect(() => {
    if (!mapRef.current) return;
    
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);
  
  // Update search radius visualization
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Remove old circle
    if (circleRef.current) {
      mapRef.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    
    // Add new circle
    circleRef.current = L.circle(center, {
      radius: searchRadius || 5000,
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(mapRef.current);
  }, [center, searchRadius]);
  
  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    
    // Remove old marker
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    
    // Add new marker
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: icons.user })
      .bindPopup('<div class="text-center"><p class="font-semibold">Your Location</p></div>')
      .addTo(mapRef.current);
  }, [userLocation]);
  
  // Update station markers
  // This optimizes rendering by only displaying stations that are within the current viewport
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;
    
    // Clear current markers
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];
    
    // OPTIMIZATION: Filter stations by viewport bounds
    // This ensures we only render markers for stations that are actually visible
    // in the current map view, improving performance significantly on large datasets
    const bounds = mapRef.current.getBounds();
    const filtered = stations.filter(station => {
      if (!station.location || !station.location.lat || !station.location.lng) {
        return false;
      }
      
      try {
        const stationLatLng = L.latLng(station.location.lat, station.location.lng);
        return bounds.contains(stationLatLng);
      } catch (error) {
        console.error('Error filtering station:', station, error);
        return false;
      }
    });
    
    setViewportStations(filtered);
    
    // Create all markers first
    const markers: L.Marker[] = [];
    
    // Add filtered stations to cluster group
    filtered.forEach(station => {
      try {
        const marker = L.marker([station.location.lat, station.location.lng], {
          icon: getStationIcon(station)
        }).on('click', () => {
          try {
            router.push(`/station?id=${station.stationId}&name=${encodeURIComponent(station.name)}`);
          } catch (error) {
            console.error('Error navigating to station:', error);
          }
        });
        
        markers.push(marker);
        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error creating marker for station:', station, error);
      }
    });
    
    // Add all markers to the cluster group at once
    clusterGroupRef.current.addLayers(markers);
    
    console.log(`Added ${filtered.length} markers to map`);
  }, [mapRef.current, stations, router]);
  
  // Update map view based on selected station
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (selectedStation) {
      mapRef.current.setView(
        [selectedStation.location.lat, selectedStation.location.lng],
        15
      );
    } else if (stations.length > 0) {
      try {
        // Create bounds from stations
        const bounds = L.latLngBounds(
          stations.map(station => [station.location.lat, station.location.lng])
        );
        
        // Include user location
        if (userLocation) {
          bounds.extend([userLocation.lat, userLocation.lng]);
        }
        
        // Fit bounds
        const zoomLevel = searchRadius && searchRadius <= 5000 ? 14 : 
                         searchRadius && searchRadius <= 10000 ? 13 : 12;
        
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: zoomLevel
        });
      } catch (error) {
        console.warn('Error updating map view:', error);
      }
    }
  }, [selectedStation, stations, userLocation, searchRadius]);
  
  return {
    map: mapRef.current,
    viewportStations
  };
}

/**
 * Main Map component
 */
export default function Map(props: MapProps) {
  // Generate a unique ID for the map container
  const mapContainerId = useRef(`map-container-${Math.random().toString(36).substr(2, 9)}`);
  
  // Add cluster styles to the page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Add the cluster styles to the document head
    const styleElement = document.createElement('style');
    styleElement.textContent = clusterStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      // Remove the style element when component unmounts
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Use the Leaflet map hook
  const { map } = useLeafletMap({
    ...props,
    containerId: mapContainerId.current
  });

  return (
    <div className="w-full h-full relative">
      <div 
        id={mapContainerId.current} 
        style={mapContainerStyle} 
        className="rounded-lg shadow-md"
      />
    </div>
  );
} 