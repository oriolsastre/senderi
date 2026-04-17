import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface HoverMarkerProps {
  position: { lat: number; lon: number } | null;
}

const hoverIcon = L.divIcon({
  className: "",
  html: '<div style="width:12px;height:12px;background:black;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export function HoverMarker({ position }: HoverMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (position) {
      markerRef.current = L.marker([position.lat, position.lon], { icon: hoverIcon }).addTo(map);
    }
  }, [position, map]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map]);

  return null;
}