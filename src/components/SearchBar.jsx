import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useMap } from "./MapContext";
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

      // Zoom to the location with smooth animation
      console.log("Zooming to:", latlng);
      map.setView(latlng, 17, {
        animate: true,
        duration: 1,
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

  return (
    <div className="relative flex flex-col w-full" ref={searchRef}>
      {/* Top row: search input only */}
      <div className="flex items-center w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowResults(true)}
            placeholder="Search for a location..."
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={16} className="text-gray-500" />
            </button>
          )}
          <Search
            size={20}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-12 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleSearchResultClick(result)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">
                {result.properties.name || result.properties.title || "Unnamed Location"}
              </div>
              {result.properties.description && (
                <div className="text-sm text-gray-600">
                  {result.properties.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchQuery && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found
        </div>
      )}

      {/* Get Directions button */}
      <button
        onClick={handleGetDirections}
        className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Get Directions
      </button>
    </div>
  );
};

export default SearchBar;
