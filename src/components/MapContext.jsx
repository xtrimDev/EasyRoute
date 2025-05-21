import { createContext, useContext } from 'react';
export const MapContext = createContext(null);

export const useMap = () => {
  const map = useContext(MapContext);
  if (!map) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return map;
};
