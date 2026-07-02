"use client";

import { useState } from "react";
import { MapPin, ZoomIn, ZoomOut } from "lucide-react";

interface MapViewProps {
  latitude?: number;
  longitude?: number;
  markers?: {
    id: string;
    lat: number;
    lng: number;
    label: string;
    price?: string;
  }[];
  height?: string;
  onMarkerClick?: (id: string) => void;
}

export default function MapView({
  latitude = 0,
  longitude = 0,
  markers = [],
  height = "400px",
  onMarkerClick,
}: MapViewProps) {
  const [zoom, setZoom] = useState(12);

  // In production, replace with react-leaflet or Google Maps
  // This is a placeholder that renders a styled map container
  return (
    <div
      className="relative bg-dark-100 rounded-2xl overflow-hidden border border-dark-200"
      style={{ height }}
    >
      {/* Map placeholder with grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5">
        <svg className="w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Center marker */}
      {!markers.length && latitude !== 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45" />
          </div>
        </div>
      )}

      {/* Markers */}
      {markers.map((marker, i) => {
        // Simple offset positioning for demo
        const offsetX = 20 + ((i * 37) % 60);
        const offsetY = 15 + ((i * 23) % 55);
        return (
          <button
            key={marker.id}
            onClick={() => onMarkerClick?.(marker.id)}
            className="absolute group"
            style={{ left: `${offsetX}%`, top: `${offsetY}%` }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              {marker.price && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {marker.price}
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Zoom controls */}
      <div className="absolute right-3 bottom-3 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z + 2, 20))}
          className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-dark-50"
        >
          <ZoomIn className="w-4 h-4 text-dark-700" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 2, 2))}
          className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-dark-50"
        >
          <ZoomOut className="w-4 h-4 text-dark-700" />
        </button>
      </div>

      {/* Coordinates display */}
      <div className="absolute left-3 bottom-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-dark-600 shadow">
        {latitude.toFixed(4)}, {longitude.toFixed(4)} | Zoom: {zoom}
      </div>
    </div>
  );
}
