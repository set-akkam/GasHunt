export interface StationWithPrices {
  stationid: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  station?: string;
  prices: {
    [key: string]: {
      price: number;
      updatedAt: string;
    };
  };
} 