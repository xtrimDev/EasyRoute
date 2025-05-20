import React, { useState, useContext, useRef, useEffect } from "react";
import { MapPin, ArrowLeft, ArrowDownUp, Locate } from "lucide-react";
import { MapContext } from "./MapContext";
import L from "leaflet";

interface DirectionsPanelProps {
  onClose: () => void;
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

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({ onClose }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);
  const currentActionRef = useRef<"start" | "end">("start");
  const [currentAction, setCurrentAction] = useState<"start" | "end">("start");

  const map = useContext(MapContext);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    currentActionRef.current = currentAction;
  }, [currentAction]);

  if (!map) return;

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (currentActionRef.current === "start") {
        if (startMarkerRef.current) {
          map.removeLayer(startMarkerRef.current);
        }
        const newMarker = L.marker(e.latlng, { icon: blueIcon }).addTo(map);
        startMarkerRef.current = newMarker;
      } else if (currentActionRef.current === "end") {
        if (endMarkerRef.current) {
          map.removeLayer(endMarkerRef.current);
        }
        const newMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map);
        endMarkerRef.current = newMarker;
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick); // cleanup
    };
  }, [map]);

  const handleGetDirections = () => {
    if (startLocation && endLocation) {
      //Decide route
      console.log(`Get directions from ${startLocation} to ${endLocation}`);
    }
  };

  const handleSwapLocations = () => {
    setIsSwapped((prev) => !prev);
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
  };

  const handelLocateStartPoint = () => {
    setCurrentAction("start");
  };

  const handelLocateEndPoint = () => {
    setCurrentAction("end");
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
            disabled={true}
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
            onClick={handelLocateStartPoint}
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
            title="Use current location"
          >
            <Locate
              size={18}
              className="text-blue-500 hover:scale-110 active:scale-90"
            />
          </button>
        </div>
      </div>

      <div className="relative left-[50%] -top-1">
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleSwapLocations}
            className={`bg-white rounded-full p-1 border border-gray-200 hover:bg-gray-50 transition ${
              isSwapped ? "rotate-180" : ""
            }`}
            title="Swap locations"
          >
            <ArrowDownUp size={25} />
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          disabled={true}
          type="text"
          value={endLocation}
          onChange={(e) => setEndLocation(e.target.value)}
          placeholder="Destination"
          className="w-full pl-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
          <MapPin size={18} />
        </div>
        <button
          onClick={handelLocateEndPoint}
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
          title="Use current location"
        >
          <Locate
            size={18}
            className="text-red-500 hover:scale-110 active:scale-90"
          />
        </button>
      </div>

      <button
        onClick={handleGetDirections}
        disabled={!startLocation || !endLocation}
        className={`w-full py-2 rounded-lg transition-colors ${
          !startLocation || !endLocation
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white active:bg-blue-700"
        }`}
      >
        Get Directions
      </button>
    </div>
  );
};

export default DirectionsPanel;
