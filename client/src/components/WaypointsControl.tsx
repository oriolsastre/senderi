import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Waypoint } from "../types/waypoint";
import { createWaypointIcon, createWaypointPopupContent } from "../utils/waypointIcons";
import { removeWaypointFromExcursio } from "../api/waypoint";

interface WaypointsControlProps {
  waypoints: Waypoint[];
  isAuthenticated?: boolean;
  excursioId?: number;
}

export function WaypointsControl({ waypoints, isAuthenticated, excursioId }: WaypointsControlProps) {
  if (waypoints.length === 0 || !isAuthenticated) return null;

  const map = useMap();
  const controlRef = useRef<L.Control.Layers | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const waypointIcon = createWaypointIcon();

  useEffect(() => {
    const handleRemoveWaypoint = async (excursioId: number, waypointId: number) => {
      try {
        await removeWaypointFromExcursio(excursioId, waypointId);
        alert("Waypoint eliminat de l'excursió!");
        window.location.reload();
      } catch (err) {
        console.error("Failed to remove waypoint:", err);
        alert("Error en eliminar el waypoint");
      }
    };
    (window as any).removeWaypointFromHike = handleRemoveWaypoint;
  }, []);

  useEffect(() => {
    if (!map) return;

    layerGroupRef.current = L.layerGroup();

    const showAddButton = isAuthenticated && excursioId;

    waypoints.forEach((wp) => {
      const marker = L.marker([wp.lat, wp.lon], { icon: waypointIcon });
      const content = createWaypointPopupContent(wp, showAddButton ? excursioId : undefined, true);
      marker.bindPopup(content);
      layerGroupRef.current!.addLayer(marker);
    });

    const overlay: { [key: string]: L.Layer } = {
      "Punts": layerGroupRef.current,
    };

    controlRef.current = L.control.layers({}, overlay, { collapsed: true }).addTo(map);
    controlRef.current.setPosition("bottomright");

    map.on("overlayadd", (e: any) => {
      if (e.layer === layerGroupRef.current) {
        layerGroupRef.current?.addTo(map);
      }
    });

    map.on("overlayremove", (e: any) => {
      if (e.layer === layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current!);
      }
    });

    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!layerGroupRef.current || waypoints.length === 0) return;

    layerGroupRef.current.clearLayers();

    const showAddButton = isAuthenticated && excursioId;

    waypoints.forEach((wp) => {
      const marker = L.marker([wp.lat, wp.lon], { icon: waypointIcon });
      const content = createWaypointPopupContent(wp, showAddButton ? excursioId : undefined, true);
      marker.bindPopup(content);
      layerGroupRef.current!.addLayer(marker);
    });
  }, [waypoints, isAuthenticated, excursioId]);

  return null;
}
