export interface FuelPriceSubmission {
  stationid: string;
  stationName: string;
  location: {
    lat: number;
    lng: number;
  };
  updates: {
    fuelType: string;
    price: number;
  }[];
} 