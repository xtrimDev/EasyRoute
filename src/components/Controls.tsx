import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize, Minimize, MapPin } from "lucide-react";
import ControlButton from "./ControlButton";

import { useMap } from "./MapContext";

interface ControlsProps {
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  toggleFullscreen,
  isFullscreen,
}) => {
  const map = useMap();

  const [showGeolocationStatus, setShowGeolocationStatus] = useState(false);
  const [geolocationMessage, setGeolocationMessage] = useState("");

  const handleGeolocation = () => {
    setShowGeolocationStatus(true);
    setGeolocationMessage("Getting your location...");

    if (!navigator.geolocation) {
      setGeolocationMessage("Geolocation is not supported by your browser");
      setTimeout(() => setShowGeolocationStatus(false), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeolocationMessage(
          `Location found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );

        // In a real implementation, you would center the map on these coordinates
        console.log(`Center map at: ${latitude}, ${longitude}`);

        setTimeout(() => setShowGeolocationStatus(false), 3000);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeolocationMessage("Location access denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeolocationMessage("Location information unavailable");
            break;
          case error.TIMEOUT:
            setGeolocationMessage("Location request timed out");
            break;
          default:
            setGeolocationMessage("An unknown error occurred");
        }
        setTimeout(() => setShowGeolocationStatus(false), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-5">
      <div className="flex flex-col space-y-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
        <ControlButton onClick={() => map.zoomIn()} tooltip="Zoom In">
          <ZoomIn size={20} />
        </ControlButton>

        <ControlButton onClick={() => map.zoomOut()} tooltip="Zoom Out">
          <ZoomOut size={20} />
        </ControlButton>

        <div className="border-t border-gray-200 my-1"></div>

        <ControlButton onClick={handleGeolocation} tooltip="Your Location">
          <MapPin size={20} />
        </ControlButton>

        <div className="border-t border-gray-200 my-1"></div>

        <ControlButton onClick={toggleFullscreen} tooltip="Toggle Fullscreen">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </ControlButton>
      </div>

      {/* Geolocation Status */}
      {showGeolocationStatus && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 text-sm w-48 transition-opacity duration-300">
          {geolocationMessage}
        </div>
      )}
    </div>
  );
};

export default Controls;
