import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface WaypointMarkerProps {
  lat: number;
  lon: number;
  onMove: (lat: number, lon: number) => void;
}

export function WaypointMarker({ lat, lon, onMove }: WaypointMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;

    if (!markerRef.current) {
      const marker = L.marker([lat, lon], { draggable: true });
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMove(Math.round(pos.lat * 1e6) / 1e6, Math.round(pos.lng * 1e6) / 1e6);
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lon]);
    }
  }, [lat, lon]);

  return null;
}