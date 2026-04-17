import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import "leaflet/dist/leaflet.css";
import "leaflet-gpx";
import "proj4leaflet";
import { MapPinIcon, FlagIcon, MapIcon, EyeIcon } from "@heroicons/react/24/solid";

const createIcon = (icon: typeof MapPinIcon, color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: ReactDOMServer.renderToStaticMarkup(
      React.createElement(icon, { className: "w-6 h-6", style: { color } })
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

const startIcon = createIcon(MapPinIcon, "#22c55e");
const endIcon = createIcon(FlagIcon, "#ef4444");
const waypointIcon = createIcon(MapIcon, "#9333ea");

// @ts-ignore - proj4leaflet adds L.Proj.CRS
const crsICGC = new L.Proj.CRS(
  "EPSG:25831",
  "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  {
    resolutions: [1100, 550, 275, 100, 50, 25, 10, 5, 2, 1, 0.5, 0.25],
    origin: [0, 0],
  }
);

interface Waypoint {
  id: number;
  nom: string | null;
  lat: number;
  lon: number;
  tipus: string;
}

interface MapProps {
  osmId: number | null;
  isAuthenticated: boolean;
}

function GPXLoader({ osmId, mapProvider }: { osmId: number; mapProvider: "osm" | "icgc" }) {
  const map = useMap();

  useEffect(() => {
    const gpxUrl = `/api/excursions/${osmId}/gpx`;

    // @ts-ignore - leaflet-gpx types not perfect
    const gpx = new L.GPX(gpxUrl, {
      async: true,
      polyline_options: {
        color: "purple",
        opacity: 0.8,
        weight: 4,
      },
      marker_options: {
        startIconUrl: "",
        endIconUrl: "",
        shadowUrl: "",
        startDivIcon: startIcon,
        endDivIcon: endIcon,
      },
    })
      .on("loaded", (e: any) => {
        map.fitBounds(e.target.getBounds());
      })
      .on("error", (e: any) => {
        console.error("GPX load error:", e);
      })
      .addTo(map);

    return () => {
      map.removeLayer(gpx);
    };
  }, [osmId]);

  return null;
}

function WaypointsHandler({ showWaypoints, waypoints, setWaypoints }: { 
  showWaypoints: boolean; 
  waypoints: Waypoint[]; 
  setWaypoints: (w: Waypoint[]) => void;
}) {
  const map = useMap();
  const waypointsLayerGroup = useRef<L.LayerGroup | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!showWaypoints) return;

    if (!fetched.current) {
      fetched.current = true;
      const bounds = map.getBounds();
      const tolerance = 0.0001;
      const params = new URLSearchParams();
      params.set("min_lat", (bounds.getSouth() - tolerance).toString());
      params.set("max_lat", (bounds.getNorth() + tolerance).toString());
      params.set("min_lon", (bounds.getWest() - tolerance).toString());
      params.set("max_lon", (bounds.getEast() + tolerance).toString());

      fetch("/api/waypoints?" + params.toString())
        .then(res => res.json())
        .then(data => setWaypoints(data));
    }
  }, [showWaypoints]);

  useEffect(() => {
    if (waypointsLayerGroup.current) {
      map.removeLayer(waypointsLayerGroup.current);
      waypointsLayerGroup.current = null;
    }

    if (!showWaypoints || waypoints.length === 0) return;

    waypointsLayerGroup.current = L.layerGroup();

    waypoints.forEach((wp) => {
      const marker = L.marker([wp.lat, wp.lon], { icon: waypointIcon });
      marker.bindPopup(wp.nom || wp.tipus);
      waypointsLayerGroup.current!.addLayer(marker);
    });

    waypointsLayerGroup.current.addTo(map);

    return () => {
      if (waypointsLayerGroup.current) {
        map.removeLayer(waypointsLayerGroup.current);
      }
    };
  }, [showWaypoints, waypoints]);

  return null;
}

export default function Map({ osmId, isAuthenticated }: MapProps) {
  const [mapProvider, setMapProvider] = useState<"osm" | "icgc">("osm");
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const handleToggleWaypoints = () => {
    setShowWaypoints(!showWaypoints);
  };

  if (!osmId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-end gap-3 mb-2">
        {isAuthenticated && (
          <button
            onClick={handleToggleWaypoints}
            className={`inline-flex items-center gap-1 text-sm ${
              showWaypoints ? "text-purple-600" : "text-black/80 hover:text-black"
            }`}
          >
            <EyeIcon className="w-4 h-4" />
            {showWaypoints ? "Amaga punts" : "Mostra punts"}
          </button>
        )}
        <a
          href={`https://www.openstreetmap.org/user/SastReO/traces/${osmId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-black/80 hover:text-black"
        >
          <MapIcon className="w-4 h-4" />
          Veure a OSM
        </a>
      </div>
      <div className="h-96 w-full rounded-lg overflow-hidden relative">
        <div className="absolute top-2 right-2 z-[1000] flex gap-1">
          <button
            onClick={() => setMapProvider("osm")}
            className={`px-2 py-1 text-xs rounded ${
              mapProvider === "osm"
                ? "bg-green-600 text-white"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            OSM
          </button>
          <button
            onClick={() => setMapProvider("icgc")}
            className={`px-2 py-1 text-xs rounded ${
              mapProvider === "icgc"
                ? "bg-green-600 text-white"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            ICGC
          </button>
        </div>
        <MapContainer
          className="h-full w-full"
          crs={mapProvider === "icgc" ? crsICGC : L.CRS.EPSG3857}
          center={mapProvider === "icgc" ? [4182545, 465195] : [41.3874, 2.1686]}
          zoom={mapProvider === "icgc" ? 6 : 13}
        >
          {mapProvider === "osm" ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <WMSTileLayer
              url="https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?"
              layers="topo"
              format="image/jpeg"
              attribution="Institut Cartogràfic i Geològic de Catalunya"
            />
          )}
          <GPXLoader osmId={osmId} mapProvider={mapProvider} />
          <WaypointsHandler showWaypoints={showWaypoints} waypoints={waypoints} setWaypoints={setWaypoints} />
        </MapContainer>
      </div>
    </div>
  );
}