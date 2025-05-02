import { StationWithPrices } from '../types/station';

export function transformStationData(station: any): StationWithPrices {
  return {
    ...station,
    stationId: station.stationId || station.stationid,
    location: station.location || {
      lat: station.latitude,
      lng: station.longitude
    },
    prices: station.prices || {
      diesel: { price: 0, updatedAt: new Date().toISOString() },
      petrol: { price: 0, updatedAt: new Date().toISOString() }
    }
  };
} 