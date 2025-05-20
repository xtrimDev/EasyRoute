import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContext } from './MapContext';
import * as turf from '@turf/turf';

interface MapProviderProps {
  children: React.ReactNode;
  setFeatures?: (features: any) => void;
}

const MapProvider: React.FC<MapProviderProps> = ({ children, setFeatures }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const leafletMap = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);

    Promise.all([
      fetch('/data/lines.geojson').then((res) => res.json()),
      fetch('/data/multipolygons.geojson').then((res) => res.json()),
    ]).then(([lines, polys]) => {
      const linesFC = lines as GeoJSON.FeatureCollection<GeoJSON.LineString>;
      const polysFC = polys as GeoJSON.FeatureCollection;

      const allFeatures = [...linesFC.features, ...polysFC.features];
      if (setFeatures) {
        setFeatures(allFeatures);
      }

      L.geoJSON(linesFC, {
        style: { color: 'blue' }, // removed fillOpacity, not needed for lines
      }).addTo(leafletMap);

      L.geoJSON(polysFC, {
        style: { color: 'green', fillOpacity: 0.4 },
      }).addTo(leafletMap);

      const combined = turf.featureCollection([...linesFC.features, ...polysFC.features]);
      const bbox = turf.bbox(combined); // [minLng, minLat, maxLng, maxLat]

      // Leaflet expects [lat, lng]
      const sw: [number, number] = [bbox[1], bbox[0]]; // [minLat, minLng]
      const ne: [number, number] = [bbox[3], bbox[2]]; // [maxLat, maxLng]

      leafletMap.fitBounds([sw, ne]);
      leafletMap.setMaxBounds([sw, ne]);

      leafletMap.setMinZoom(15);
      leafletMap.setZoom(15);

      // Outer polygon covers almost entire world (lat, lng)
      const outer = [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
        [-90, -180],
      ];

      // Inner polygon is the bbox polygon (lat, lng)
      const inner = [
        [bbox[1], bbox[0]], // SW (minLat, minLng)
        [bbox[1], bbox[2]], // SE (minLat, maxLng)
        [bbox[3], bbox[2]], // NE (maxLat, maxLng)
        [bbox[3], bbox[0]], // NW (maxLat, minLng)
        [bbox[1], bbox[0]], // Close ring
      ];

      L.polygon(
        [
          outer as L.LatLngTuple[],
          inner as L.LatLngTuple[],
        ],
        {
          color: '#000',
          fillColor: '#fff',
          fillOpacity: 1,
          weight: 0,
        }
      ).addTo(leafletMap);
    });

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, []);

  return (
    <div className="h-full w-full z-0 relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  );
};

export default MapProvider;
