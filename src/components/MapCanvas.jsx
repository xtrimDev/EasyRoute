import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContext } from './MapContext';
import * as turf from '@turf/turf';

const MapProvider = ({ children, setFeatures }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

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
      const linesFC = lines;
      const polysFC = polys;

      const allFeatures = [...linesFC.features, ...polysFC.features];
      if (setFeatures) {
        setFeatures(allFeatures);
      }

      L.geoJSON(linesFC, {
        style: { color: 'blue' },
      }).addTo(leafletMap);

      L.geoJSON(polysFC, {
        style: { color: 'green', fillOpacity: 0.4 },
      }).addTo(leafletMap);

      const combined = turf.featureCollection([...linesFC.features, ...polysFC.features]);
      const bbox = turf.bbox(combined); // [minLng, minLat, maxLng, maxLat]

      const sw = [bbox[1], bbox[0]]; // [minLat, minLng]
      const ne = [bbox[3], bbox[2]]; // [maxLat, maxLng]

      leafletMap.fitBounds([sw, ne]);
      leafletMap.setMaxBounds([sw, ne]);

      leafletMap.setMinZoom(15);
      leafletMap.setZoom(15);

      const outer = [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
        [-90, -180],
      ];

      const inner = [
        [bbox[1], bbox[0]],
        [bbox[1], bbox[2]],
        [bbox[3], bbox[2]],
        [bbox[3], bbox[0]],
        [bbox[1], bbox[0]],
      ];

      L.polygon([outer, inner], {
        color: '#000',
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(leafletMap);
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
