import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Waypoint } from "../types/waypoint";
import { createWaypointIcon, createWaypointPopupContent } from "../utils/waypointMarkers";
import { addWaypointToExcursio } from "../api/waypoint";

interface WaypointsLayerProps {
  showWaypoints: boolean;
  waypoints: Waypoint[];
  isHikingMap?: boolean;
  belongsToHike?: boolean;
  excursioId?: number;
  isAuthenticated?: boolean;
}

export function WaypointsLayer({ showWaypoints, waypoints, isHikingMap = true, belongsToHike = false, excursioId, isAuthenticated }: WaypointsLayerProps) {
  const map = useMap();
  const waypointsLayerGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const handleAddWaypoint = async (excursioId: number, waypointId: number) => {
      try {
        await addWaypointToExcursio(excursioId, waypointId, false);
        alert("Waypoint afegit a l'excursió!");
      } catch (err) {
        console.error("Failed to add waypoint:", err);
        alert("Error en afegir el waypoint");
      }
    };
    (window as any).addWaypointToHike = handleAddWaypoint;
  }, []);

  useEffect(() => {
    if (waypointsLayerGroup.current) {
      map.removeLayer(waypointsLayerGroup.current);
      waypointsLayerGroup.current = null;
    }

    if (!showWaypoints || waypoints.length === 0) return;

    waypointsLayerGroup.current = L.layerGroup();

    const showAddButton = isHikingMap && isAuthenticated && excursioId;

    waypoints.forEach((wp) => {
      const marker = L.marker([wp.lat, wp.lon], { icon: createWaypointIcon(wp) });
      const content = createWaypointPopupContent(wp, showAddButton ? excursioId : undefined, belongsToHike, isAuthenticated);
      marker.bindPopup(content);
      waypointsLayerGroup.current!.addLayer(marker);
    });

    waypointsLayerGroup.current.addTo(map);

    return () => {
      if (waypointsLayerGroup.current) {
        map.removeLayer(waypointsLayerGroup.current);
      }
    };
  }, [showWaypoints, waypoints, isHikingMap, belongsToHike, excursioId, isAuthenticated]);

  return null;
}