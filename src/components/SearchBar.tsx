import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, X } from "lucide-react";

interface SearchBarProps {
  onGetDirections: () => void;
}

const MOCK_SEARCH_RESULTS = [
  { id: 1, name: "Central Park", address: "New York, NY 10022" },
  { id: 2, name: "Empire State Building", address: "350 Fifth Avenue, New York, NY 10118" },
  { id: 3, name: "Golden Gate Bridge", address: "San Francisco, CA 94129" },
  { id: 4, name: "Times Square", address: "Manhattan, NY 10036" },
];

const SearchBar: React.FC<SearchBarProps> = ({ onGetDirections }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

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
    setShowResults(value.length > 0);
  };

  const handleSearchResultClick = (resultName: string) => {
    setSearchTerm(resultName);
    setShowResults(false);

    // In a real app, you would center the map on the selected location
    console.log("Selected location:", resultName);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const filteredResults = MOCK_SEARCH_RESULTS.filter(
    (result) =>
      result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.address.toLowerCase().includes(searchTerm.toLowerCase())
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
                {filteredResults.map((result) => (
                  <li
                    key={result.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSearchResultClick(result.name)}
                  >
                    <div className="flex items-start">
                      <MapPin
                        size={16}
                        className="text-gray-400 mt-1 mr-2 flex-shrink-0"
                      />
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-gray-500">
                          {result.address}
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
