import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize, Minimize, Map, Navigation, RefreshCw } from "lucide-react";
import ControlButton from "./ControlButton";
import { useMap } from "./MapContext";

const Controls = ({ toggleFullscreen, isFullscreen }) => {
  const { map, changeMapStyle, currentStyle, showCurrentLocation, refreshMap } = useMap();
  const [showStyles, setShowStyles] = useState(false);
  const dropdownRef = useRef(null);

  const mapStyles = [
    { id: 'streets', label: 'Streets' },
    { id: 'satellite', label: 'Satellite' },
    { id: 'terrain', label: 'Terrain' }
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStyles(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStyleChange = (styleId) => {
    changeMapStyle(styleId);
    setShowStyles(false);
  };

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="flex flex-col space-y-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 rounded-lg shadow-lg">
        <ControlButton onClick={() => map.zoomIn()} tooltip="Zoom In" className="cursor-pointer">
          <ZoomIn size={20} className="text-gray-700 dark:text-gray-300" />
        </ControlButton>

        <ControlButton onClick={() => map.zoomOut()} tooltip="Zoom Out" className="cursor-pointer">
          <ZoomOut size={20} className="text-gray-700 dark:text-gray-300" />
        </ControlButton>

        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

        <ControlButton onClick={toggleFullscreen} tooltip="Toggle Fullscreen" className="cursor-pointer">
          {isFullscreen ? <Minimize size={20} className="text-gray-700 dark:text-gray-300" /> : <Maximize size={20} className="text-gray-700 dark:text-gray-300" />}
        </ControlButton>

        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

        <ControlButton 
          onClick={showCurrentLocation} 
          tooltip="Show Current Location" 
          className="cursor-pointer"
        >
          <Navigation size={20} className="text-gray-700 dark:text-gray-300" />
        </ControlButton>

        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

        <ControlButton 
          onClick={refreshMap} 
          tooltip="Refresh Map" 
          className="cursor-pointer"
        >
          <RefreshCw size={20} className="text-gray-700 dark:text-gray-300" />
        </ControlButton>

        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

        <div className="relative" ref={dropdownRef}>
          <ControlButton 
            onClick={() => setShowStyles(!showStyles)} 
            tooltip="Map Style" 
            className="cursor-pointer"
          >
            <Map size={20} className="text-gray-700 dark:text-gray-300" />
          </ControlButton>
          {showStyles && (
            <div className="absolute right-full mr-2 top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 min-w-[120px]">
              {mapStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${
                    currentStyle === style.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
