import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { getWaypoints, getExcursionsByWaypoint } from "../api/waypoint";
import { createWaypointIcon, createWaypointPopupContent } from "../utils/waypointMarkers";
import type { Waypoint } from "../api/waypoint";
import LeafletMap from "../components/LeafletMap";

interface MapaProps {
  isAuthenticated: boolean;
}

function WaypointsLayer({ waypoints, isAuthenticated }: { waypoints: Waypoint[]; isAuthenticated: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    if (waypoints.length === 0) return;

    layerRef.current = L.layerGroup();

    waypoints.forEach((wp) => {
      const marker = L.marker([wp.lat, wp.lon], { icon: createWaypointIcon(wp as any) });
      const popupContent = createWaypointPopupContent(wp as any, undefined, false, isAuthenticated);
      marker.bindPopup(popupContent);
      
      marker.on("popupopen", async () => {
        try {
          const excursions = await getExcursionsByWaypoint(wp.id);
          if (excursions.length > 0) {
            const excursionsHtml = excursions.map(e => 
              `<a href="/excursions/${e.slug}" class="text-purple-600 hover:underline text-sm">${e.data_inici}</a>`
            ).join(", ");
            const popup = marker.getPopup();
            if (popup) {
              const content = createWaypointPopupContent(wp as any, undefined, false, isAuthenticated);
              popup.setContent(`${content}<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ccc;"><strong>Excursions:</strong> ${excursionsHtml}</div>`);
            }
          }
        } catch (err) {
          console.error("Failed to load excursions:", err);
        }
      });
      
      layerRef.current!.addLayer(marker);
    });

    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [waypoints, map]);

  return null;
}

export default function Mapa({ isAuthenticated }: MapaProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWaypoints()
      .then(setWaypoints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-4 text-black">Carregant...</div>;
  }

  return (
    <div className="py-4">
      <LeafletMap className="h-[calc(100vh-120px)] w-full">
        <WaypointsLayer waypoints={waypoints} isAuthenticated={isAuthenticated} />
      </LeafletMap>
    </div>
  );
}