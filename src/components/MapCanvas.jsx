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
  const currentLocationMarkerRef = useRef(null);

  // Function to get and show user's current location
  const showCurrentLocation = () => {
    console.log("showCurrentLocation called");
    if (!map) {
      console.log("Map not initialized yet");
      return;
    }

    if ("geolocation" in navigator) {
      console.log("Geolocation is available");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got position:", position);
          const { latitude, longitude } = position.coords;
          
          // Remove existing marker if any
          if (currentLocationMarkerRef.current) {
            map.removeLayer(currentLocationMarkerRef.current);
          }

          // Create a custom icon for current location
          const currentLocationIcon = L.divIcon({
            className: 'current-location-marker',
            html: `<div style="
              width: 20px;
              height: 20px;
              background-color: #4285F4;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          // Add marker for current location
          currentLocationMarkerRef.current = L.marker([latitude, longitude], {
            icon: currentLocationIcon
          }).addTo(map);

          // Center map on current location
          map.setView([latitude, longitude], 16);
          console.log("Map centered on current location");
        },
        (error) => {
          console.error("Error getting location:", error);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.error("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.error("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.error("The request to get user location timed out.");
              break;
            case error.UNKNOWN_ERROR:
              console.error("An unknown error occurred.");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    console.log("Initializing map");
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
      console.log("Map data loaded");
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

      // Set the map state first
      setMap(leafletMap);
    });

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Add a new useEffect to handle showing current location after map is initialized
  useEffect(() => {
    if (map) {
      console.log("Map is initialized, showing current location");
      showCurrentLocation();
    }
  }, [map]);

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
        <MapContext.Provider value={{ map, changeMapStyle, currentStyle, showCurrentLocation }}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
};

export default MapCanvas;
