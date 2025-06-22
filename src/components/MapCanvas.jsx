import React, { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContext } from './MapContext';
import * as turf from '@turf/turf';

// TomTom API key - Replace with your actual API key
const TOMTOM_API_KEY = "DpX5BjVjsheAFaIzc4k9DOGUCUpECORO";

const mapStyles = {
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // Dark mode styles
  terrainDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  streetsDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satelliteDark: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const MapCanvas = ({ children, setFeatures, onClearMap, startMarkRef, endMarkRef, routingLineRef }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('terrain');
  const tileLayerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const trafficLegendRef = useRef(null);

  // Add refs for POI layers
  const poiLayersRef = useRef({
    hospitals: null,
    hotels: null,
    petrolPumps: null
  });

  // Add refs for route markers and polylines
  const routeMarkersRef = useRef([]);
  const routePolylineRef = useRef(null);

  // Function to get and show user's current location
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

  // Function to update traffic visualization
  const updateTraffic = async () => {
    if (!map) return;

    const bounds = map.getBounds();
    const { _southWest: sw, _northEast: ne } = bounds;

    try {
      // Remove existing traffic layer
      if (trafficLayerRef.current) {
        trafficLayerRef.current.remove();
      }

      // Create a new layer group for traffic
      trafficLayerRef.current = L.layerGroup().addTo(map);

      const zoom = Math.min(Math.max(map.getZoom(), 0), 22);
      const latStep = (ne.lat - sw.lat) / 3;
      const lngStep = (ne.lng - sw.lng) / 3;

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

            if (data.flowSegmentData && data.flowSegmentData.coordinates && data.flowSegmentData.coordinates.coordinate) {
              const coordinates = data.flowSegmentData.coordinates.coordinate;
              const currentSpeed = data.flowSegmentData.currentSpeed;
              const freeFlowSpeed = data.flowSegmentData.freeFlowSpeed;
              
              const speedRatio = currentSpeed / freeFlowSpeed;
              let flow;
              if (speedRatio >= 0.9) flow = 1;
              else if (speedRatio >= 0.7) flow = 2;
              else if (speedRatio >= 0.5) flow = 3;
              else flow = 4;

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
          const isDark = document.documentElement.classList.contains('dark');
          const bgColor = isDark ? '#1f2937' : 'white';
          const textColor = isDark ? '#f3f4f6' : '#333';
          const borderColor = isDark ? '#4b5563' : '#333';
          
          div.innerHTML = `
            <div style="background: ${bgColor}; padding: 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid ${borderColor}; min-width: 180px;">
              <h4 style="margin: 0 0 8px 0; color: ${textColor}; font-weight: bold; font-size: 14px; text-align: center;">🚦 Traffic Flow</h4>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #00FF00; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Free Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #FFFF00; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Heavy Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #FFA500; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Slow Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #FF0000; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Congested</span>
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
    const isDark = document.documentElement.classList.contains('dark');
    let initialStyleKey = currentStyle;
    if (isDark && currentStyle !== 'satellite') {
      initialStyleKey = currentStyle + 'Dark';
    }
    tileLayerRef.current = L.tileLayer(mapStyles[initialStyleKey]).addTo(leafletMap);

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
      
      // Initial traffic update - pass the map instance directly
      updateTrafficWithMap(leafletMap);
    });

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Helper function to update traffic with a specific map instance
  const updateTrafficWithMap = async (mapInstance) => {
    if (!mapInstance) return;

    const bounds = mapInstance.getBounds();
    const { _southWest: sw, _northEast: ne } = bounds;

    try {
      // Remove existing traffic layer
      if (trafficLayerRef.current) {
        trafficLayerRef.current.remove();
      }

      // Create a new layer group for traffic
      trafficLayerRef.current = L.layerGroup().addTo(mapInstance);

      const zoom = Math.min(Math.max(mapInstance.getZoom(), 0), 22);
      const latStep = (ne.lat - sw.lat) / 3;
      const lngStep = (ne.lng - sw.lng) / 3;

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

            if (data.flowSegmentData && data.flowSegmentData.coordinates && data.flowSegmentData.coordinates.coordinate) {
              const coordinates = data.flowSegmentData.coordinates.coordinate;
              const currentSpeed = data.flowSegmentData.currentSpeed;
              const freeFlowSpeed = data.flowSegmentData.freeFlowSpeed;
              
              const speedRatio = currentSpeed / freeFlowSpeed;
              let flow;
              if (speedRatio >= 0.9) flow = 1;
              else if (speedRatio >= 0.7) flow = 2;
              else if (speedRatio >= 0.5) flow = 3;
              else flow = 4;

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
          const isDark = document.documentElement.classList.contains('dark');
          const bgColor = isDark ? '#1f2937' : 'white';
          const textColor = isDark ? '#f3f4f6' : '#333';
          const borderColor = isDark ? '#4b5563' : '#333';
          
          div.innerHTML = `
            <div style="background: ${bgColor}; padding: 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid ${borderColor}; min-width: 180px;">
              <h4 style="margin: 0 0 8px 0; color: ${textColor}; font-weight: bold; font-size: 14px; text-align: center;">🚦 Traffic Flow</h4>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #00FF00; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Free Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #FFFF00; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Heavy Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #FFA500; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Slow Flow</span>
              </div>
              <div style="display: flex; align-items: center; margin: 6px 0;">
                <div style="width: 25px; height: 6px; background: #FF0000; margin-right: 8px; border: 2px solid #000; border-radius: 2px;"></div>
                <span style="color: ${textColor}; font-weight: 600; font-size: 12px;">Congested</span>
              </div>
            </div>
          `;
          return div;
        };
        legend.addTo(mapInstance);
        trafficLegendRef.current = legend;
      }

    } catch (error) {
      console.error('Error in updateTraffic:', error);
    }
  };

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
      // Get current theme
      const isDark = document.documentElement.classList.contains('dark');
      
      // Choose appropriate style based on theme
      let styleKey = style;
      if (isDark && style !== 'satellite') {
        styleKey = style + 'Dark';
      }
      
      tileLayerRef.current.setUrl(mapStyles[styleKey]);
      setCurrentStyle(style);
    }
  };

  // Function to update map style based on theme
  const updateMapStyleForTheme = () => {
    if (map && tileLayerRef.current) {
      const isDark = document.documentElement.classList.contains('dark');
      let styleKey = currentStyle;
      if (isDark && currentStyle !== 'satellite') {
        styleKey = currentStyle + 'Dark';
      }
      tileLayerRef.current.setUrl(mapStyles[styleKey]);
    }
  };

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateMapStyleForTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [map, currentStyle]);

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

      let data;

      const response = await fetch(
        `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${center.lat}&lon=${center.lng}&radius=${radius}&categorySet=${getPOICategory(poiType)}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
      console.log(`${poiType} API data:`, data);

      if (!data.results || data.results.length === 0) {
        console.log(`No ${poiType} found in the area`);
        alert(`No ${poiType} found in the area. Try moving the map to a different location.`);
        return;
      }

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
      alert(`Error fetching ${poiType}. Please check your internet connection and try again.`);
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

  // Comprehensive refresh function
  const refreshMap = () => {
    if (!map) return;

    // Clear current location marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.remove();
      currentLocationMarkerRef.current = null;
    }

    // Clear traffic layer
    if (trafficLayerRef.current) {
      trafficLayerRef.current.remove();
      trafficLayerRef.current = null;
    }

    // Clear traffic legend
    if (trafficLegendRef.current) {
      trafficLegendRef.current.remove();
      trafficLegendRef.current = null;
    }

    // Clear all POI layers
    Object.values(poiLayersRef.current).forEach(layer => {
      if (layer) {
        layer.remove();
      }
    });
    poiLayersRef.current = {
      hospitals: null,
      hotels: null,
      petrolPumps: null
    };

    // Clear route markers
    routeMarkersRef.current.forEach(marker => {
      if (marker) {
        marker.remove();
      }
    });
    routeMarkersRef.current = [];

    // Clear route polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Clear route planning markers if provided
    if (startMarkRef && startMarkRef.current) {
      startMarkRef.current.remove();
      startMarkRef.current = null;
    }
    if (endMarkRef && endMarkRef.current) {
      endMarkRef.current.remove();
      endMarkRef.current = null;
    }
    if (routingLineRef && routingLineRef.current) {
      routingLineRef.current.remove();
      routingLineRef.current = null;
    }

    // Reset map to initial view
    map.setView([30.2842, 77.9946], 15);

    // Call parent's clear map function if provided
    if (onClearMap) {
      onClearMap();
    }

    console.log('Map refreshed - all markers, routes, and POIs cleared');
  };

  return (
    <div className="h-full w-full z-0 relative">
      <div ref={mapRef} className="w-full h-full z-0" />
      {map && (
        <MapContext.Provider value={{ map, changeMapStyle, currentStyle, showCurrentLocation, refreshMap }}>
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
