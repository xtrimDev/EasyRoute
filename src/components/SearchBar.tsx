import React, { useState, useRef, useEffect, useContext } from "react";
import { Search, MapPin, X } from "lucide-react";
import { MapContext } from "./MapContext";
import * as turf from "@turf/turf";
import L from 'leaflet';


interface SearchBarProps {
  onGetDirections: () => void;
  features?: any;
}

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SearchBar: React.FC<SearchBarProps> = ({ onGetDirections, features }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const map = useContext(MapContext);

  const markerRef = useRef<L.Marker | null>(null);


  useEffect(() => {
    // Close search results when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsContainerRef.current &&
        !resultsContainerRef.current.contains(event.target as Node) &&
        searchInputRef.current !== event.target
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      //fetch from map
      console.log("Searching for:", searchTerm);

      setShowResults(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.trim().length > 0);
  };

const handleSearchResultClick = (resultFeature: any) => {
  const coords = turf.center(resultFeature).geometry.coordinates;
  const latlng: [number, number] = [coords[1], coords[0]];

  if (!map) return;

  // Remove previous marker if it exists
  if (markerRef.current) {
    map.removeLayer(markerRef.current);
  }

  // Create a new marker with the custom red icon
  const newMarker = L.marker(latlng, {
    icon: redIcon,
    title: resultFeature.properties?.name || "Selected Location",
  }).addTo(map);

  markerRef.current = newMarker; // store it

  map.setView(latlng, 17); // zoom in
  setSearchTerm(resultFeature.properties?.name || "");
  setShowResults(false);
};


  const handleClearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const filteredResults = Array.from(
    new Map(
      (features || [])
        .filter((feature: any) => {
          const name = feature.properties?.name || "";
          const address = feature.properties?.address || "";

          return (
            name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
            address.toLowerCase().includes(searchTerm.trim().toLowerCase())
          );
        })
        .map((feature: any) => {
          const key = `${feature.properties?.name ?? ""}|${
            feature.properties?.address ?? ""
          }`;
          return [key, feature]; // [key, value] for Map
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
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onClick={() => setShowResults(searchTerm.length > 0)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div
            ref={resultsContainerRef}
            className="absolute mt-2 w-full bg-white rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto"
          >
            {filteredResults.length > 0 ? (
              <ul>
                {filteredResults.map((feature: any, index: number) => (
                  <li
                    key={feature.id || index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSearchResultClick(feature)}
                  >
                    <div className="flex items-start">
                      <MapPin
                        size={16}
                        className="text-gray-400 mt-1 mr-2 flex-shrink-0"
                      />
                      <div>
                        <div className="font-medium">
                          {feature.properties?.name || "Unnamed Feature"}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchTerm ? (
              <div className="px-4 py-3 text-gray-500">
                No results found for "{searchTerm}"
              </div>
            ) : null}
          </div>
        )}
      </form>

      <div className="mt-4">
        <button
          onClick={onGetDirections}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
