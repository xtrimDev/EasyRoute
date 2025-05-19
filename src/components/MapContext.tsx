import { createContext, useContext } from 'react';
import L from 'leaflet';

export const MapContext = createContext<L.Map | null>(null);

export const useMap = () => {
  const map = useContext(MapContext);
  if (!map) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return map;
};
