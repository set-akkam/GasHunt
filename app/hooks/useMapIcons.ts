import L from 'leaflet';
import type { StationWithPrices } from '@/types/station';

// Define consistent icon size
const ICON_SIZE = 40;
const ICON_ANCHOR = ICON_SIZE / 2;

// Define icons for different markers
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

export const useMapIcons = () => {
  // Helper function to get icon based on station brand
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

  return {
    icons,
    getStationIcon,
  };
};

export default useMapIcons; 