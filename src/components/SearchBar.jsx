import React, { useState, useRef, useEffect, useContext } from "react";
import { Search, MapPin, X } from "lucide-react";
import { MapContext } from "./MapContext";
import * as turf from "@turf/turf";
import L from "leaflet";

// Red marker icon 
const redIcon = new L.Icon({
  iconUrl:
    "/icons/marker-icon-red.png",
  shadowUrl:
    "/icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SearchBar = ({ onGetDirections, features }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const map = useContext(MapContext);
  const markerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultsContainerRef.current &&
        !resultsContainerRef.current.contains(event.target) &&
        searchInputRef.current !== event.target
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log("Searching for:", searchTerm);
      setShowResults(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.trim().length > 0);
  };

  const handleSearchResultClick = (feature) => {
    if (!map) return;

    const coords = turf.center(feature).geometry.coordinates;
    const latlng = [coords[1], coords[0]];

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const newMarker = L.marker(latlng, {
      icon: redIcon,
      title: feature.properties?.name || "Selected Location",
    }).addTo(map);

    markerRef.current = newMarker;
    map.setView(latlng, 17);
    setSearchTerm(feature.properties?.name || "");
    setShowResults(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const filteredResults = Array.from(
    new Map(
      (features || [])
        .filter((feature) => {
          const name = feature.properties?.name || "";
          const address = feature.properties?.address || "";
          return (
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            address.toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
        .map((feature) => {
          const key = `${feature.properties?.name ?? ""}|${feature.properties?.address ?? ""}`;
          return [key, feature];
        })
    ).values()
  );

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Search places, addresses..."
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg"
            onClick={() => setShowResults(searchTerm.length > 0)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {showResults && (
          <div
            ref={resultsContainerRef}
            className="absolute mt-2 w-full bg-white rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto"
          >
            {filteredResults.length > 0 ? (
              <ul>
                {filteredResults.map((feature, index) => (
                  <li
                    key={feature.id || index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSearchResultClick(feature)}
                  >
                    <div className="flex items-start">
                      <MapPin size={16} className="text-gray-400 mt-1 mr-2" />
                      <div className="font-medium">
                        {feature.properties?.name || "Unnamed Feature"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-gray-500">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </form>

      <div className="mt-4">
        <button
          onClick={onGetDirections}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
        >
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
