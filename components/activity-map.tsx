"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

export function ActivityMap({ encodedPolyline }: { encodedPolyline: string | null }) {
  const points = useMemo(() => {
    if (!encodedPolyline) return [];
    try {
      return polyline.decode(encodedPolyline);
    } catch {
      return [];
    }
  }, [encodedPolyline]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 rounded-md bg-bg-subtle text-sm text-fg-muted">
        No GPS track available
      </div>
    );
  }

  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const span = Math.max(
    Math.max(...lats) - Math.min(...lats),
    Math.max(...lngs) - Math.min(...lngs)
  );
  const zoom = span > 1 ? 9 : span > 0.3 ? 11 : span > 0.1 ? 13 : 14;

  return (
    <div className="h-72 rounded-md overflow-hidden border border-bg-border">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "#15171c" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={points as [number, number][]} pathOptions={{ color: "#fc4c02", weight: 4 }} />
      </MapContainer>
    </div>
  );
}
