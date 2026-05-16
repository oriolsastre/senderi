import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "/assets/icons/marker.svg",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -35],
});

interface WaypointMarkerProps {
  lat: number;
  lon: number;
  draggable?: boolean;
  onMove: (lat: number, lon: number) => void;
}

export function WaypointMarker({ lat, lon, draggable = true, onMove }: WaypointMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;

    if (!markerRef.current) {
      const marker = L.marker([lat, lon], { draggable, icon: markerIcon });
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMove(Math.round(pos.lat * 1e6) / 1e6, Math.round(pos.lng * 1e6) / 1e6);
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lon]);
      if (draggable) {
        markerRef.current.dragging?.enable();
      } else {
        markerRef.current.dragging?.disable();
      }
    }

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [lat, lon, draggable]);

  return null;
}
