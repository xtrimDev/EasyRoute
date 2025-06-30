import React, { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContext } from './MapContext';
import * as turf from '@turf/turf';

const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

const mapStyles = {
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const MapCanvas = ({ children, setFeatures }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('terrain');
  const tileLayerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const trafficLegendRef = useRef(null);

  const poiLayersRef = useRef({
    hospitals: null,
    hotels: null,
    petrolPumps: null
  });

  const showCurrentLocation = () => {
    if (!map) {
      console.log("Map not initialized yet");
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Remove existing marker if any
          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.remove();
          }
          
          // Create a new marker for current location
          currentLocationMarkerRef.current = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: "#4A90E2",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map);
          
          // Center map on current location
          map.setView([latitude, longitude], 16);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  // Function to get traffic color based on flow
  const getTrafficColor = (flow) => {
    console.log('Getting color for flow:', flow);
    switch (flow) {
      case 0: // No data
        return '#808080';
      case 1: // Free flow
        return '#00FF00';
      case 2: // Heavy flow
        return '#FFFF00';
      case 3: // Slow flow
        return '#FFA500';
      case 4: // Congested flow
        return '#FF0000';
      default:
        return '#808080';
    }
  };

  // Function to update traffic visualization using TomTom API
  const updateTraffic = async () => {
    if (!map) return;

    const bounds = map.getBounds();
    const { _southWest: sw, _northEast: ne } = bounds;
    const zoom = Math.min(Math.max(map.getZoom(), 0), 22);

    try {
      // Remove existing traffic layer
      if (trafficLayerRef.current) {
        trafficLayerRef.current.remove();
      }

      // Create a new layer group for traffic
      trafficLayerRef.current = L.layerGroup().addTo(map);

      // Create a grid of points to cover the visible area
      const latStep = (ne.lat - sw.lat) / 3;
      const lngStep = (ne.lng - sw.lng) / 3;

      // Make API calls for each point in the grid
      for (let lat = sw.lat; lat <= ne.lat; lat += latStep) {
        for (let lng = sw.lng; lng <= ne.lng; lng += lngStep) {
          const point = `${lat},${lng}`;
          
          try {
            const response = await fetch(
              `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json?key=${TOMTOM_API_KEY}&point=${point}&zoom=${zoom}&style=s3`
            );

            if (!response.ok) {
              console.error(`Error for point ${point}:`, await response.text());
              continue;
            }

            const data = await response.json();
            console.log(`Traffic data for point ${point}:`, data);

            // Process and style the roads based on traffic flow
            if (data.flowSegmentData && data.flowSegmentData.coordinates && data.flowSegmentData.coordinates.coordinate) {
              const coordinates = data.flowSegmentData.coordinates.coordinate;
              const currentSpeed = data.flowSegmentData.currentSpeed;
              const freeFlowSpeed = data.flowSegmentData.freeFlowSpeed;
              
              // Calculate traffic flow based on speed ratio
              const speedRatio = currentSpeed / freeFlowSpeed;
              let flow;
              if (speedRatio >= 0.9) flow = 1; // Free flow
              else if (speedRatio >= 0.7) flow = 2; // Heavy flow
              else if (speedRatio >= 0.5) flow = 3; // Slow flow
              else flow = 4; // Congested flow

              // Create line segments for each pair of coordinates
              for (let i = 0; i < coordinates.length - 1; i++) {
                const current = coordinates[i];
                const next = coordinates[i + 1];
                
                const color = getTrafficColor(flow);
                
                L.polyline(
                  [[current.latitude, current.longitude], [next.latitude, next.longitude]],
                  {
                    color: color,
                    weight: 6,
                    opacity: 0.8,
                    lineJoin: 'round'
                  }
                ).addTo(trafficLayerRef.current);
              }
            }
          } catch (error) {
            console.error(`Error processing point ${point}:`, error);
            continue;
          }
        }
      }

      // Add traffic legend only if it doesn't exist
      if (!trafficLegendRef.current) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function() {
          const div = L.DomUtil.create('div', 'traffic-legend');
          div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.2);">
              <h4 style="margin: 0 0 5px 0;">Traffic Flow</h4>
              <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 4px; background: #00FF00; margin-right: 5px;"></div>
                <span>Free Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 4px; background: #FFFF00; margin-right: 5px;"></div>
                <span>Heavy Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 4px; background: #FFA500; margin-right: 5px;"></div>
                <span>Slow Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 4px; background: #FF0000; margin-right: 5px;"></div>
                <span>Congested</span>
              </div>
            </div>
          `;
          return div;
        };
        legend.addTo(map);
        trafficLegendRef.current = legend;
      }

    } catch (error) {
      console.error('Error in updateTraffic:', error);
    }
  };

  // Update traffic when map moves
  useEffect(() => {
    if (!map) return;

    const handleMapMove = () => {
      updateTraffic();
    };

    map.on('moveend', handleMapMove);
    return () => {
      map.off('moveend', handleMapMove);
    };
  }, [map]);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log("Initializing map");
    const leafletMap = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 15
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

      // Set the map state first
      setMap(leafletMap);
      
      // Initial traffic update
      updateTraffic();
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
      tileLayerRef.current.setUrl(mapStyles[style]);
      setCurrentStyle(style);
    }
  };

  // Function to fetch and display nearby POIs
  const showNearbyPOIs = async (poiType) => {
    if (!map) return;

    const center = map.getCenter();
    const radius = 5000; // 5km radius

    try {
      // Remove existing POI layer if it exists
      if (poiLayersRef.current[poiType]) {
        poiLayersRef.current[poiType].remove();
      }

      // Create a new layer group for POIs
      poiLayersRef.current[poiType] = L.layerGroup().addTo(map);

      // Fetch POIs from TomTom API
      const response = await fetch(
        `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${center.lat}&lon=${center.lng}&radius=${radius}&categorySet=${getPOICategory(poiType)}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`${poiType} data:`, data);

      // Add markers for each POI
      data.results.forEach(poi => {
        const marker = L.marker([poi.position.lat, poi.position.lon], {
          icon: getPOIIcon(poiType)
        });

        // Add popup with POI information
        marker.bindPopup(`
          <div style="font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px;">${poi.poi.name}</h3>
            <p style="margin: 0; font-size: 12px;">${poi.address.freeformAddress}</p>
            ${poi.poi.phone ? `<p style="margin: 5px 0; font-size: 12px;">📞 ${poi.poi.phone}</p>` : ''}
            ${poi.poi.url ? `<p style="margin: 5px 0; font-size: 12px;"><a href="${poi.poi.url}" target="_blank">🌐 Website</a></p>` : ''}
          </div>
        `);

        marker.addTo(poiLayersRef.current[poiType]);
      });

    } catch (error) {
      console.error(`Error fetching ${poiType}:`, error);
    }
  };

  // Function to get POI category ID
  const getPOICategory = (poiType) => {
    switch (poiType) {
      case 'hospitals':
        return '7392'; // Hospitals category
      case 'hotels':
        return '7314'; // Hotels category
      case 'petrolPumps':
        return '7311'; // Gas stations category
      default:
        return '';
    }
  };

  // Function to get POI icon
  const getPOIIcon = (poiType) => {
    const iconUrl = {
      hospitals: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      hotels: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      petrolPumps: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
    };

    return L.icon({
      iconUrl: iconUrl[poiType],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Function to clear all POI layers
  const clearPOIs = () => {
    Object.values(poiLayersRef.current).forEach(layer => {
      if (layer) {
        layer.remove();
      }
    });
  };

  return (
    <div className="h-full w-full z-0 relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {map && (
        <MapContext.Provider value={{ map, changeMapStyle, currentStyle, showCurrentLocation }}>
          {children}
        </MapContext.Provider>
      )}
      <div className="map-controls" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => showNearbyPOIs('hospitals')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          🏥 Hospitals
        </button>
        <button
          onClick={() => showNearbyPOIs('hotels')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4444ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          🏨 Hotels
        </button>
        <button
          onClick={() => showNearbyPOIs('petrolPumps')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          ⛽ Petrol Pumps
        </button>
        <button
          onClick={clearPOIs}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          ❌ Clear POIs
        </button>
      </div>
    </div>
  );
};

export default MapCanvas;
