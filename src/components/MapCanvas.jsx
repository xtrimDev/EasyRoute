import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContext } from './MapContext';
import * as turf from '@turf/turf';

const mapStyles = {
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};

const MapCanvas = ({ children, setFeatures }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('streets');
  const tileLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const leafletMap = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 15,
      maxZoom: 18
    }).setView([30.2842, 77.9946], 15); // Set initial view to the campus area

    // Initialize with default style
    tileLayerRef.current = L.tileLayer(mapStyles[currentStyle]).addTo(leafletMap);

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
        style: { color: 'transparent' },
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

  // Function to change map style
  const changeMapStyle = (style) => {
    if (map && tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = L.tileLayer(mapStyles[style]).addTo(map);
      setCurrentStyle(style);
    }
  };

  return (
    <div className="h-full w-full z-0 relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {map && (
        <MapContext.Provider value={{ map, changeMapStyle, currentStyle }}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
};

export default MapCanvas;
