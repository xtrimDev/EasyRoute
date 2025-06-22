import { useState, useRef, useEffect } from "react";

import MapCanvas from "./MapCanvas";
import SearchBar from "./SearchBar";
import DirectionsPanel from "./DirectionsPanel";
import Controls from "./Controls";

import { Search, X } from "lucide-react";

const MapApp = ({ routeInfo, setRouteInfo }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSelectingPoint, setIsSelectingPoint] = useState(false);

  const [features, setFeatures] = useState([]);
  const [linesData, setLinesData] = useState(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  /**Direction  panel things */
  const startMarkRef = useRef(null);
  const endMarkRef = useRef(null);
  const routingLineRef = useRef(null);

  const toggleDirections = () => {
    setShowDirections(!showDirections);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handlePointSelectionStart = () => {
    setIsSelectingPoint(true);
    setIsMobileMenuOpen(false);
  };

  const handlePointSelectionEnd = () => {
    setIsSelectingPoint(false);
  };

  const handleClearMap = () => {
    // Clear route info
    setRouteInfo(null);
    
    // Clear markers
    if (startMarkRef.current) {
      startMarkRef.current = null;
    }
    if (endMarkRef.current) {
      endMarkRef.current = null;
    }
    
    // Reset directions panel
    setShowDirections(false);
    
    // Reset mobile menu
    setIsMobileMenuOpen(false);
    
    // Reset point selection
    setIsSelectingPoint(false);
    
    console.log('Map cleared - all routes, markers, and panels reset');
  };

  useEffect(() => {
    fetch("/data/lines.geojson")
      .then((res) => res.json())
      .then((data) => setLinesData(data))
      .catch(console.error);
  }, []);

  return (
    <div className="relative h-full w-full bg-gray-100 dark:bg-gray-900 transition-colors">
      <MapCanvas 
        setFeatures={setFeatures} 
        onClearMap={handleClearMap}
        startMarkRef={startMarkRef}
        endMarkRef={endMarkRef}
        routingLineRef={routingLineRef}
      >
        {/* Mobile Menu Button */}
        {!isMobileMenuOpen ? (
          <div className="absolute top-4 left-4 md:hidden z-20">
            <button
              onClick={toggleMobileMenu}
              className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} className="text-gray-700 dark:text-gray-300" /> : <Search size={20} className="text-gray-700 dark:text-gray-300" />}
            </button>
          </div>
        ) : null}

        {/* Desktop Search Panel */}
        <div className="absolute top-4 left-4 right-4 hidden md:block z-10 w-[400px] m-auto">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
            {showDirections ? (
              <DirectionsPanel
                onClose={toggleDirections}
                startMarkRef={startMarkRef}
                endMarkRef={endMarkRef}
                routingLineRef={routingLineRef}
                linesGeoJSON={linesData}
                onPointSelectionStart={handlePointSelectionStart}
                onPointSelectionEnd={handlePointSelectionEnd}
                onRouteInfoChange={setRouteInfo}
              />
            ) : (
              <SearchBar
                features={features}
                onGetDirections={toggleDirections}
                routeInfo={routeInfo}
              />
            )}
          </div>
        </div>

        {/* Mobile Search Panel */}
        <div
          className={`absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-[1002] transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Map Navigation</h2>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {showDirections ? (
                <DirectionsPanel
                  onClose={toggleDirections}
                  startMarkRef={startMarkRef}
                  endMarkRef={endMarkRef}
                  routingLineRef={routingLineRef}
                  linesGeoJSON={linesData}
                  onPointSelectionStart={handlePointSelectionStart}
                  onPointSelectionEnd={handlePointSelectionEnd}
                  onMarking={toggleMobileMenu}
                  onRouteInfoChange={setRouteInfo}
                />
              ) : (
                <SearchBar 
                  features={features} 
                  onGetDirections={toggleDirections}
                  onSearchResultClick={() => setIsMobileMenuOpen(false)}
                  routeInfo={routeInfo}
                />
              )}
            </div>
          </div>
        </div>

        <Controls
          toggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      </MapCanvas>
    </div>
  );
};

export default MapApp;
