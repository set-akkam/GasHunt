export interface Station {
  _id: string;
  stationId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  link?: string;
  phone?: string;
  google_maps?: string;
  opening_hours?: {
    [key: string]: string;
  };
  services?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FuelPrice {
  _id: string;
  station: string | Station;
  fuelType: string;
  price: number;
  submittedBy: string;
  submissionVoteScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface StarredStation {
  _id: string;
  userId: string;
  station: string | Station;
  starredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StationWithPrices extends Station {
  prices?: {
    [fuelType: string]: {
      price: number;
      updatedAt: string;
    };
  };
  distance?: number; // Distance in meters from user location
}

export interface NearbyStationsRequest {
  lat: number;
  lng: number;
  radius?: number; // in meters
  bounds?: string; // Format: north,east,south,west for viewport bounds
}

export interface StationSyncData {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  services?: string[];
  opening_hours?: {
    [key: string]: string;
  };
} 