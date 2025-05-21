import { useState, useRef, useContext, useEffect } from "react";

import MapCanvas from "./MapCanvas";
import SearchBar from "./SearchBar";
import DirectionsPanel from "./DirectionsPanel";
import Controls from "./Controls";

import { MapContext } from "./MapContext";

import { Search, X } from "lucide-react";

const MapApp = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [features, setFeatures] = useState([]);
  const [linesData, setLinesData] = useState(null);


  const map = useContext(MapContext);

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

  const toggleDirections = () => {
    setShowDirections(!showDirections);

    if (map) {
      if (startMarkRef.current) {
        map.removeLayer(startMarkRef.current);
        startMarkRef.current = null;
      }

      if (endMarkRef.current) {
        map.removeLayer(endMarkRef.current);
        endMarkRef.current = null;
      }
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    fetch("/data/lines.geojson")
      .then((res) => res.json())
      .then((data) => setLinesData(data))
      .catch(console.error);
  }, []);


  return (
    <div className="relative h-full w-full bg-gray-100">
      <MapCanvas setFeatures={setFeatures}>
        {!isMobileMenuOpen ? (
          <div className="absolute top-4 left-4 md:hidden z-20">
            <button
              onClick={toggleMobileMenu}
              className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>
        ) : null}

        <div className="absolute top-4 left-4 right-4 hidden md:block z-10 w-[400px] m-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-md mx-auto">
            {showDirections ? (
              <DirectionsPanel
                onClose={toggleDirections}
                startMarkRef={startMarkRef}
                endMarkRef={endMarkRef}
                linesGeoJSON={linesData}
              />
            ) : (
              <SearchBar
                features={features}
                onGetDirections={toggleDirections}
              />
            )}
          </div>
        </div>

        <div
          className={`absolute inset-0 bg-white/95 backdrop-blur-sm z-10 transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Map Navigation</h2>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {showDirections ? (
              <DirectionsPanel
                onClose={toggleDirections}
                startMarkRef={startMarkRef}
                endMarkRef={endMarkRef}
                linesGeoJSON={linesData}
              />
            ) : (
              <SearchBar onGetDirections={toggleDirections} />
            )}
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
