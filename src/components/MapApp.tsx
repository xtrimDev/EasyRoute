import React, { useState } from 'react';
import MapCanvas from './MapCanvas';
import Controls from './Controls';
import SearchBar from './SearchBar';
import DirectionsPanel from './DirectionsPanel';
import { Search, X } from 'lucide-react';

const MapApp = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
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

  const toggleDirections = () => {
    setShowDirections(!showDirections);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="relative h-full w-full bg-gray-100">
      <MapCanvas />
      {!isMobileMenuOpen ? 
      <div className="absolute top-4 left-4 md:hidden z-20">
        <button 
          onClick={toggleMobileMenu}
          className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>
      : <></>}
      
      {/* Search & Directions Panel - Desktop */}
      <div className="absolute top-4 left-4 right-4 hidden md:block z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-md mx-auto">
          {showDirections ? (
            <DirectionsPanel onClose={toggleDirections} />
          ) : (
            <SearchBar onGetDirections={toggleDirections} />
          )}
        </div>
      </div>
      
      {/* Search & Directions Panel - Mobile */}
      <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm z-10 transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
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
            <DirectionsPanel onClose={toggleDirections} />
          ) : (
            <SearchBar onGetDirections={toggleDirections} />
          )}
        </div>
      </div>
      
      {/* Controls */}
      <Controls 
        toggleFullscreen={toggleFullscreen} 
        isFullscreen={isFullscreen}
      />
    </div>
  );
};

export default MapApp;