'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Station {
  id: string;
  name: string;
  address: string;
  price: number;
  lastUpdated: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface StationContextType {
  selectedStation: Station | null;
  setSelectedStation: (station: Station | null) => void;
  stations: Station[];
  setStations: (stations: Station[]) => void;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stations, setStations] = useState<Station[]>([]);

  return (
    <StationContext.Provider value={{ selectedStation, setSelectedStation, stations, setStations }}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
} 