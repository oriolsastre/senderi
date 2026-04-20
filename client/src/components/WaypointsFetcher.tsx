import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Waypoint } from "../types/waypoint";

interface WaypointsFetcherProps {
  waypoints: Waypoint[];
  setWaypoints: (w: Waypoint[]) => void;
  excursioId: number;
}

export function WaypointsFetcher({ waypoints, setWaypoints, excursioId }: WaypointsFetcherProps) {
  const map = useMap();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;

    fetched.current = true;
    fetch(`/api/excursions/${excursioId}/waypoints`)
      .then(res => res.json())
      .then(data => setWaypoints(data))
      .catch(err => console.error("Failed to load waypoints:", err));
  }, [excursioId, setWaypoints]);

  return null;
}