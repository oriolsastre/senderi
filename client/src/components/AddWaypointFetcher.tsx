import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Waypoint } from "../types/waypoint";

interface AddWaypointFetcherProps {
  showAddWaypoints: boolean;
  setWaypoints: (w: Waypoint[]) => void;
  excursioId?: number;
}

export function AddWaypointFetcher({ showAddWaypoints, setWaypoints, excursioId }: AddWaypointFetcherProps) {
  const map = useMap();
  const fetched = useRef(false);

  useEffect(() => {
    if (!showAddWaypoints || fetched.current) return;

    fetched.current = true;
    const bounds = map.getBounds();
    const tolerance = 0.00001;
    const params = new URLSearchParams();
    params.set("min_lat", (bounds.getSouth() - tolerance).toString());
    params.set("max_lat", (bounds.getNorth() + tolerance).toString());
    params.set("min_lon", (bounds.getWest() - tolerance).toString());
    params.set("max_lon", (bounds.getEast() + tolerance).toString());

    if (excursioId) {
      params.set("no_excursio", excursioId.toString());
    }

    fetch("/api/waypoints?" + params.toString())
      .then(res => res.json())
      .then(data => setWaypoints(data));
  }, [showAddWaypoints, excursioId]);

  return null;
}