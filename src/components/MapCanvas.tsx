import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import * as turf from "@turf/turf";


import "leaflet/dist/leaflet.css";

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const [mode, setMode] = useState<"start" | "end">("start");
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const routingLineRef = useRef<L.Polyline | null>(null);

  const nodeIndex: Record<string, { coord: number[] }> = {};
  const graph: Record<string, { node: string; weight: number }[]> = {};

  const addNode = (coord: number[]): string => {
    const key = coord.join(",");
    if (!nodeIndex[key]) {
      nodeIndex[key] = { coord };
    }
    return key;
  };

  const addEdge = (a: string, b: string, weight: number) => {
    graph[a] = graph[a] || [];
    graph[b] = graph[b] || [];
    graph[a].push({ node: b, weight });
    graph[b].push({ node: a, weight });
  };

  const buildGraph = (lines: GeoJSON.FeatureCollection<GeoJSON.LineString>) => {
    lines.features.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i],
          b = coords[i + 1];
        const keyA = addNode(a);
        const keyB = addNode(b);
        const dist = turf.distance(turf.point(a), turf.point(b));
        addEdge(keyA, keyB, dist);
      }
    });
  };

  const dijkstra = (startKey: string, endKey: string): number[][] => {
    const dist: Record<string, number> = {};
    const prev: Record<string, string | undefined> = {};
    const queue = new Set(Object.keys(graph));

    Object.keys(graph).forEach((node) => (dist[node] = Infinity));
    dist[startKey] = 0;

    while (queue.size) {
      const minNode = [...queue].reduce((a, b) => (dist[a] < dist[b] ? a : b));
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

    const path: string[] = [];
    let u: string | undefined = endKey;
    while (u) {
      path.unshift(u);
      u = prev[u];
    }
    return path.map((k) => nodeIndex[k].coord);
  };

  const findNearestNode = (latlng: L.LatLng): string | null => {
    let minKey: string | null = null;
    let minDist = Infinity;
    for (const key in nodeIndex) {
      const pt = nodeIndex[key].coord;
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

  const calculatePath = () => {
    const start = startMarkerRef.current;
    const end = endMarkerRef.current;
    if (!start || !end) {
      alert("Set both start and end points.");
      return;
    }

    const startKey = findNearestNode(start.getLatLng());
    const endKey = findNearestNode(end.getLatLng());

    if (!startKey || !endKey) {
      alert("Could not find graph nodes near markers.");
      return;
    }

    const pathCoords = dijkstra(startKey, endKey);
    if (!pathCoords.length) {
      alert("No route found.");
      return;
    }

    if (routingLineRef.current) {
      leafletMapRef.current?.removeLayer(routingLineRef.current);
    }

    routingLineRef.current = L.polyline(
      pathCoords.map((c) => [c[1], c[0]]),
      { color: "red" }
    ).addTo(leafletMapRef.current!);
  };

  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      const map = L.map(mapRef.current, {zoomControl: false});
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => {
        if (mode === "start") {
          if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
          startMarkerRef.current = L.marker(e.latlng).addTo(map);
        } else if (mode === "end") {
          if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
          endMarkerRef.current = L.marker(e.latlng).addTo(map);
        }
      });

      Promise.all([
        fetch("/data/lines.geojson").then((res) => res.json()),
        fetch("/data/multipolygons.geojson").then((res) => res.json()),
      ]).then(([lines, polys]) => {
        const linesFC = lines as GeoJSON.FeatureCollection<GeoJSON.LineString>;
        const polysFC = polys as GeoJSON.FeatureCollection;

        L.geoJSON(linesFC, {
          style: { color: "blue", fillOpacity: 0.1 },
        }).addTo(map);
        L.geoJSON(polysFC, {
          style: { color: "green", fillOpacity: 0.4 },
        }).addTo(map);

        const combined = turf.featureCollection([
          ...linesFC.features,
          ...polysFC.features,
        ]);
        const bbox = turf.bbox(combined);
        const sw = [bbox[1], bbox[0]] as [number, number];
        const ne = [bbox[3], bbox[2]] as [number, number];
        map.fitBounds([sw, ne]);
        map.setMaxBounds([sw, ne]);
        map.setMinZoom(map.getZoom());

        turf.polygon([
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ],
        ]);
        const outer = [
          [-90, -180],
          [-90, 180],
          [90, 180],
          [90, -180],
          [-90, -180],
        ];

        const inner = [
          [bbox[1], bbox[0]], // SW
          [bbox[1], bbox[2]], // SE
          [bbox[3], bbox[2]], // NE
          [bbox[3], bbox[0]], // NW
          [bbox[1], bbox[0]],
        ];

        L.polygon([outer, inner], {
          color: "#000",
          fillColor: "#fff",
          fillOpacity: 1,
          weight: 0,
        }).addTo(map);

        buildGraph(linesFC);
      });
    }
  }, [mode]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        zIndex: 0,
        position: "relative",
      }}
    >
      <div
        className="nav-buttons"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 9999,
          background: "white",
          padding: 10,
          borderRadius: 6,
          boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        <button onClick={() => setMode("start")}>Set Start</button>
        <br />
        <button onClick={() => setMode("end")}>Set End</button>
        <br />
        <button onClick={calculatePath}>Navigate</button>
      </div>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

export default MapComponent;
