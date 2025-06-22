import React, { useState, useRef, useEffect } from "react";
import { Search, X, Mic, MicOff } from "lucide-react";
import { useMap } from "./MapContext";
import { useVoice } from "../hooks/useVoice";
import L from "leaflet";

// Red marker icon 
const redIcon = new L.Icon({
  iconUrl: "/icons/marker-icon-red.png",
  shadowUrl: "/icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SearchBar = ({ features, onGetDirections, onSearchResultClick, routeInfo }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const markerRef = useRef(null);
  const { map } = useMap();
  const { isListening, startListening } = useVoice();

  // Debug map context
  useEffect(() => {
    console.log("Map context:", map);
  }, [map]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Filter results and remove duplicates based on name
    const uniqueResults = Array.from(
      new Map(
        features
          .filter((feature) => {
            if (!feature.properties || !feature.geometry) return false;

            const searchableText = Object.values(feature.properties)
              .filter((value) => typeof value === "string")
              .join(" ")
              .toLowerCase();

            return searchableText.includes(query.toLowerCase());
          })
          .map((feature) => {
            // Create a unique key based on name only
            const name = feature.properties?.name || feature.properties?.title || "Unnamed Location";
            return [name, feature];
          })
      ).values()
    );

    // console.log("Search results:", uniqueResults);
    setSearchResults(uniqueResults);
    setShowResults(true);
  };

  const handleVoiceInput = () => {
    startListening((result) => {
      setSearchQuery(result);
      // Trigger search with voice input
      const event = { target: { value: result } };
      handleSearch(event);
    });
  };

  const handleSearchResultClick = (feature) => {
    console.log("Clicked feature:", feature);
    
    if (!map) {
      console.error("Map not initialized");
      return;
    }

    try {
      // Get coordinates from the feature
      let coordinates;
      if (feature.geometry.type === "Point") {
        coordinates = feature.geometry.coordinates;
      } else if (feature.geometry.type === "Polygon") {
        // For polygons, use the first point of the first ring
        coordinates = feature.geometry.coordinates[0][0];
      } else if (feature.geometry.type === "MultiPolygon") {
        // For multipolygons, use the first point of the first ring of the first polygon
        coordinates = feature.geometry.coordinates[0][0][0];
      } else if (feature.geometry.type === "LineString") {
        // For linestrings, use the first point
        coordinates = feature.geometry.coordinates[0];
      }

      console.log("Feature coordinates:", coordinates);
      
      if (!coordinates || coordinates.length < 2) {
        console.error("Invalid coordinates found in feature");
        return;
      }

      // Remove existing marker if any
      if (markerRef.current) {
        console.log("Removing existing marker");
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Create new marker Note: GeoJSON uses [longitude, latitude] order
      const latlng = L.latLng(coordinates[1], coordinates[0]);
      console.log("Creating marker at:", latlng);
      
      // Ensure map container is ready
      if (!map._container || !map._loaded) {
        console.log("Waiting for map to be ready...");
        map.once('load', () => {
          console.log("Map is ready, adding marker");
          addMarkerAndZoom(latlng, feature);
        });
      } else {
        console.log("Map is ready, adding marker immediately");
        addMarkerAndZoom(latlng, feature);
      }

    } catch (error) {
      console.error("Error handling search result click:", error);
    }
  };

  const addMarkerAndZoom = (latlng, feature) => {
    try {
      // Ensure map container exists
      if (!map._container) {
        console.error("Map container not found");
        return;
      }

      // Create and add marker
      const newMarker = L.marker(latlng, {
        icon: redIcon,
        title: feature.properties?.name || "Selected Location",
      });

      // Add marker to map
      newMarker.addTo(map);

      // Add popup with location name
      if (feature.properties?.name) {
        newMarker.bindPopup(feature.properties.name).openPopup();
      }

      markerRef.current = newMarker;

      // Fly to the location with smooth animation
      console.log("Flying to:", latlng);
      map.flyTo(latlng, 17, {
        duration: 1.5,
        easeLinearity: 0.25
      });

      // Close results and clear search
      setShowResults(false);
      setSearchQuery("");
      setSearchResults([]);

      // Call the callback if provided
      if (onSearchResultClick) {
        onSearchResultClick();
      }
    } catch (error) {
      console.error("Error adding marker and zooming:", error);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    // Remove existing marker if any
    if (markerRef.current && map) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  const handleGetDirections = () => {
    if (markerRef.current && map) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    onGetDirections();
  };

  const handleFindLocation = () => {
    // Just find the location without going to directions mode
    // The location is already marked when user clicks on search result
    // This button provides an alternative way to find the location
    if (markerRef.current && map) {
      // If there's already a marker, just focus on it
      const latlng = markerRef.current.getLatLng();
      map.flyTo(latlng, 17, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else if (searchQuery.trim() !== "") {
      // If there's a search query but no marker, try to find the first result
      if (searchResults.length > 0) {
        handleSearchResultClick(searchResults[0]);
      }
    }
  };

  return (
    <div className="relative flex flex-col w-full" ref={searchRef}>
      {/* Prominent route info box */}
      {routeInfo && (
        <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex flex-row items-center justify-center gap-8 text-blue-900 dark:text-blue-100 font-semibold text-base shadow">
          <span>Distance: {routeInfo.distance.toFixed(2)} km</span>
          <span>Estimated Time: {routeInfo.time} min</span>
        </div>
      )}
      {/* Top row: search input only */}
      <div className="flex items-center w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowResults(true)}
            placeholder="Search for a location..."
            className="w-full px-4 py-2 pr-20 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <button
            onClick={handleVoiceInput}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
            }`}
            title={isListening ? "Listening..." : "Voice input"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-700">
          {searchResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleSearchResultClick(result)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {result.properties.name || result.properties.title || "Unnamed Location"}
              </div>
              {result.properties.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {result.properties.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchQuery && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          No results found
        </div>
      )}

      {/* Find Location button */}
      <button
        onClick={handleFindLocation}
        className="w-full mt-4 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
      >
        Find Location
      </button>

      {/* Get Directions text option */}
      <div className="mt-3 text-center">
        <button
          onClick={handleGetDirections}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors text-sm"
        >
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
