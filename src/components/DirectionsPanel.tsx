import React, { useState } from 'react';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';

interface DirectionsPanelProps {
  onClose: () => void;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({ onClose }) => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  
  const handleGetDirections = () => {
    if (startLocation && endLocation) {
      // In a real app, you would fetch actual routes here
      console.log(`Get directions from ${startLocation} to ${endLocation}`);
    }
  };
  
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setStartLocation(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Unable to get your current location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };
  
  const handleSwapLocations = () => {
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <button 
          onClick={onClose}
          className="p-2 mr-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">Directions</h2>
      </div>
      <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Starting point"
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                <MapPin size={18} />
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
                title="Use current location"
              >
                <Navigation size={18} />
              </button>
            </div>
          </div>

          <div className="relative left-[50%] -top-1">
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-10">
              <button
                onClick={handleSwapLocations}
                className="bg-white rounded-full p-1 border border-gray-200 hover:bg-gray-50"
                title="Swap locations"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10L3 14L7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 14L21 10L17 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 10H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 14H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              placeholder="Destination"
              className="w-full pl-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <MapPin size={18} />
            </div>
          </div>
          
          <button
            onClick={handleGetDirections}
            disabled={!startLocation || !endLocation}
            className={`w-full py-2 rounded-lg transition-colors ${
              !startLocation || !endLocation 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white active:bg-blue-700'
            }`}
          >
            Get Directions
          </button>
    </div>
  );
};

export default DirectionsPanel;