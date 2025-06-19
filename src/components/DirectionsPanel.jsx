import React, { useState, useContext, useRef, useEffect } from "react";
import { MapPin, ArrowLeft, ArrowDownUp, Locate, X } from "lucide-react";
import { MapContext } from "./MapContext";
import L from "leaflet";
import * as turf from "@turf/turf";

const redIcon = new L.Icon({
  iconUrl: "/icons/marker-icon-red.png",
  shadowUrl: "/icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: "/icons/marker-icon-blue.png",
  shadowUrl: "/icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DirectionsPanel = ({
  onClose,
  startMarkRef,
  endMarkRef,
  linesGeoJSON,
  onPointSelectionStart,
  onPointSelectionEnd,
  onMarking,
}) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  const currentActionRef = useRef(currentAction);
  const routingLineRef = useRef(null);
  const nodeIndexRef = useRef({});
  const graphRef = useRef({});
  const [mode, setMode] = useState("walking");

  const { map } = useContext(MapContext);

  // Speed factors in km/h for each mode
  const speedFactors = {
    walking: 5,
    cycling: 15,
    driving: 40,
  };

  useEffect(() => {
    currentActionRef.current = currentAction;
  }, [currentAction]);

  useEffect(() => {
    if (!linesGeoJSON) return;

    const nodeIndex = {};
    const graph = {};

    function addNode(coord) {
      const key = coord.join(",");
      if (!nodeIndex[key]) {
        nodeIndex[key] = { coord, neighbors: [] };
      }
      return key;
    }

    function addEdge(a, b, weight) {
      graph[a] = graph[a] || [];
      graph[b] = graph[b] || [];
      graph[a].push({ node: b, weight });
      graph[b].push({ node: a, weight });
    }

    linesGeoJSON.features.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i];
        const b = coords[i + 1];
        const keyA = addNode(a);
        const keyB = addNode(b);
        const dist = turf.distance(turf.point(a), turf.point(b)); // in km
        // Adjust weight based on selected mode's speed (time = distance / speed)
        const weight = dist / speedFactors[mode];
        addEdge(keyA, keyB, weight);
      }
    });

    nodeIndexRef.current = nodeIndex;
    graphRef.current = graph;
  }, [linesGeoJSON, mode]);

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      const { lat, lng } = e.latlng;

      if (currentActionRef.current === "start") {
        if (startMarkRef.current) {
          map.removeLayer(startMarkRef.current);
        }

        const newMarker = L.marker(e.latlng, { icon: blueIcon }).addTo(map);
        startMarkRef.current = newMarker;
        setStartLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setCurrentAction("");
        if (onPointSelectionEnd) onPointSelectionEnd();
        if (onMarking) onMarking();
      } else if (currentActionRef.current === "end") {
        if (endMarkRef.current) {
          map.removeLayer(endMarkRef.current);
        }

        const newMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map);
        endMarkRef.current = newMarker;
        setEndLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setCurrentAction("");
        if (onPointSelectionEnd) onPointSelectionEnd();
        if (onMarking) onMarking();
      }
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, onPointSelectionEnd]);

  const handleClose = () => {
    if (map) {
      if (startMarkRef.current) {
        map.removeLayer(startMarkRef.current);
        startMarkRef.current = null;
      }
      if (endMarkRef.current) {
        map.removeLayer(endMarkRef.current);
        endMarkRef.current = null;
      }
      if (routingLineRef.current) {
        map.removeLayer(routingLineRef.current);
        routingLineRef.current = null;
      }
    }
    setStartLocation("");
    setEndLocation("");
    setCurrentAction("");
    onClose();
  };

  const handleSwapLocations = () => {
    setIsSwapped((prev) => !prev);

    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);

    if (startMarkRef.current && endMarkRef.current) {
      const startLatLng = startMarkRef.current.getLatLng();
      const endLatLng = endMarkRef.current.getLatLng();

      startMarkRef.current.setLatLng(endLatLng);
      endMarkRef.current.setLatLng(startLatLng);
    }
  };

  const handleGetDirections = () => {
    
    const startPoint = startMarkRef.current;
    const endPoint = endMarkRef.current;

    if (!startPoint || !endPoint) {
      alert("Please set both start and end points.");
      return;
    }

    const startLatLng = startPoint.getLatLng();
    const endLatLng = endPoint.getLatLng();

    const startKey = findNearestNode(startLatLng);
    const endKey = findNearestNode(endLatLng);

    if (!startKey || !endKey) {
      alert(
        "Could not find nearest graph nodes. Make sure start/end are near the lines."
      );
      return;
    }

    const pathCoords = dijkstra(startKey, endKey);
    if (!pathCoords.length) {
      alert("No route found between points.");
      return;
    }

    if (routingLineRef.current) {
      map.removeLayer(routingLineRef.current);
    }
    routingLineRef.current = L.polyline(
      pathCoords.map((c) => [c[1], c[0]]),
      { color: "red" }
    ).addTo(map);

    // Optionally, show estimated time
    const totalDistance = getTotalDistance(pathCoords); // in km
    const estTime = totalDistance / speedFactors[mode]; // in hours
    const estMinutes = Math.round(estTime * 60);
    if (estMinutes > 0) {
      alert(`Estimated time: ${estMinutes} min (${totalDistance.toFixed(2)} km) by ${mode}`);
    }

    if (onMarking) onMarking();
  };

  const handlePointSelection = (type) => {
    setCurrentAction(type);
    if (onPointSelectionStart) onPointSelectionStart();
  };

  const cancelPointSelection = () => {
    setCurrentAction("");
    if (onPointSelectionEnd) onPointSelectionEnd();
  };

  /**---------------------------------------------------- */
  const findNearestNode = (latlng) => {
    let minKey = null;
    let minDist = Infinity;
    const nodeIndex = nodeIndexRef.current;

    for (const key in nodeIndex) {
      const pt = nodeIndex[key].coord;
      if (!pt || isNaN(pt[0]) || isNaN(pt[1])) continue;

      // Note: turf points: [lng, lat]
      const d = turf.distance(
        turf.point(pt),
        turf.point([latlng.lng, latlng.lat])
      );
      if (d < minDist) {
        minDist = d;
        minKey = key;
      }
    }
    return minKey;
  };

  const dijkstra = (startKey, endKey) => {
    const graph = graphRef.current;
    const dist = {};
    const prev = {};
    const queue = new Set(Object.keys(graph));

    for (const node of queue) dist[node] = Infinity;
    dist[startKey] = 0;

    while (queue.size > 0) {
      let minNode = null;
      let minDist = Infinity;
      
      for (const node of queue) {
        if (dist[node] < minDist) {
          minDist = dist[node];
          minNode = node;
        }
      }
      if (!minNode) break;
      queue.delete(minNode);

      if (minNode === endKey) break;

      for (const neighbor of graph[minNode]) {
        const alt = dist[minNode] + neighbor.weight;
        if (alt < dist[neighbor.node]) {
          dist[neighbor.node] = alt;
          prev[neighbor.node] = minNode;
        }
      }
    }

    let path = [];
    let u = endKey;
    while (u) {
      path.unshift(u);
      u = prev[u];
    }
    return path.map((k) => nodeIndexRef.current[k].coord);
  };

  // Helper to calculate total distance
  const getTotalDistance = (coords) => {
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      dist += turf.distance(turf.point(coords[i]), turf.point(coords[i + 1]));
    }
    return dist;
  };
  /**---------------------------------------------------- */

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <button
          onClick={handleClose}
          className="p-2 mr-2 rounded-full hover-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">Directions</h2>
      </div>

      {/* Transport Mode Selector */}
      <div className="flex justify-center mb-4 space-x-2">
        <button
          className={`px-3 py-1 rounded-full border ${mode === "walking" ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
          onClick={() => setMode("walking")}
        >
          🚶 Walking
        </button>
        <button
          className={`px-3 py-1 rounded-full border ${mode === "cycling" ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
          onClick={() => setMode("cycling")}
        >
          🚴 Cycling
        </button>
        <button
          className={`px-3 py-1 rounded-full border ${mode === "driving" ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
          onClick={() => setMode("driving")}
        >
          🚗 Driving
        </button>
      </div>

      {/* Start input */}
      <div className="mb-4">
        <div className="relative">
          <input
            disabled
            type="text"
            value={startLocation}
            placeholder="Starting point"
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
            <MapPin size={18} />
          </div>
          <button
            onClick={() => handlePointSelection("start")}
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            title="Use map to set starting point"
          >
            <Locate
              size={18}
              strokeWidth={currentAction === "start" ? 5 : 2}
              className="text-blue-500"
            />
          </button>
        </div>
      </div>

      {/* Swap button */}
      <div className="relative left-1/2 -top-1">
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleSwapLocations}
            className={`bg-white rounded-full p-1 border border-gray-200 transition ${
              isSwapped ? "rotate-180" : ""
            }`}
            title="Swap locations"
          >
            <ArrowDownUp size={25} />
          </button>
        </div>
      </div>

      {/* End input */}
      <div className="relative mb-4">
        <input
          disabled
          type="text"
          value={endLocation}
          placeholder="Destination"
          className="w-full pl-10 py-2 bg-gray-50 border border-gray-200 rounded-lg"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500">
          <MapPin size={18} />
        </div>
        <button
          onClick={() => handlePointSelection("end")}
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
          title="Use map to set destination"
        >
          <Locate
            size={18}
            strokeWidth={currentAction === "end" ? 5 : 2}
            className="text-red-500"
          />
        </button>
      </div>

      {/* Directions button */}
      <button
        onClick={handleGetDirections}
        disabled={!startLocation || !endLocation}
        className={`w-full py-2 rounded-lg transition-colors ${
          !startLocation || !endLocation
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        Get Directions
      </button>
    </div>
  );
};

export default DirectionsPanel;
