import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-gpx";
import "proj4leaflet";
import ReactDOMServer from "react-dom/server";
import { MapIcon, EyeIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { ElevationChart } from "./ElevationChart";
import { HoverMarker } from "./HoverMarker";
import { updateExcursio } from "../api/excursio";

const createHeroIcon = (icon: typeof MapIcon, color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: ReactDOMServer.renderToStaticMarkup(
      React.createElement(icon, { className: "w-6 h-6", style: { color } })
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

const waypointIcon = createHeroIcon(MapIcon, "#9333ea");

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
  comentari?: string;
  wikidata?: number;
  osm_node?: number;
}

interface MapProps {
  id: number;
  osmId: number | null;
  isAuthenticated: boolean;
}

interface GPXStats {
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  elevation_max: number;
  elevation_min: number;
}

function GPXLoader({ osmId }: { osmId: number }) {
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
      markers: {
        startIcon: "/assets/icons/start.svg",
        endIcon: "/assets/icons/finish.svg",
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

function StatsLoader({ osmId, onStatsLoaded }: { osmId: number; onStatsLoaded: (stats: GPXStats) => void }) {
  useEffect(() => {
    fetch(`/api/excursions/${osmId}/gpx/stats`)
      .then(res => res.json())
      .then(onStatsLoaded)
      .catch(err => console.error("Failed to load stats:", err));
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
      const tolerance = 0.00001;
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
      const title = wp.nom || wp.tipus;
      let content = wp.comentari
        ? `<strong>${title}</strong><br/>${wp.comentari}`
        : `<strong>${title}</strong>`;
      
      const links: string[] = [];
      if (wp.wikidata) {
        links.push(`<a href="https://www.wikidata.org/wiki/Q${wp.wikidata}" target="_blank" rel="noopener noreferrer"><img src="/assets/icons/services/wikidata-logo.svg" alt="Wikidata" style="width:16px;height:16px;vertical-align:middle;margin-left:4px;"></a>`);
      }
      if (wp.osm_node) {
        links.push(`<a href="https://www.openstreetmap.org/node/${wp.osm_node}" target="_blank" rel="noopener noreferrer"><img src="/assets/icons/services/openstreetmap-logo.svg" alt="OSM" style="width:16px;height:16px;vertical-align:middle;margin-left:4px;"></a>`);
      }
      if (links.length > 0) {
        content += `<div style="margin-top:4px;">${links.join("")}</div>`;
      }
      
      marker.bindPopup(content);
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

export default function Map({ id, osmId, isAuthenticated }: MapProps) {
  const [mapProvider, setMapProvider] = useState<"osm" | "icgc">("osm");
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [gpxStats, setGpxStats] = useState<GPXStats | null>(null);
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [trackPoints, setTrackPoints] = useState<{ lat: number; lon: number; ele: number }[]>([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatsLoaded = (stats: GPXStats) => {
    setGpxStats(stats);
  };

  const handleToggleWaypoints = () => {
    setShowWaypoints(!showWaypoints);
  };

  const handleSaveStats = async () => {
    if (!gpxStats || !id) return;
    setIsSaving(true);
    try {
      await updateExcursio(id, {
        distancia: gpxStats.distance,
        desnivell_pos: gpxStats.elevation_gain,
        desnivell_neg: gpxStats.elevation_loss,
      });
    } catch (err) {
      console.error("Failed to save stats:", err);
    }
    setIsSaving(false);
  };

  useEffect(() => {
    if (!osmId) return;
    fetch(`/api/excursions/${osmId}/gpx`)
      .then(res => res.text())
      .then(gpxText => {
        setGpxData(gpxText);
        // Parse track points from GPX
        const parser = new DOMParser();
        const doc = parser.parseFromString(gpxText, "application/xml");
        const trkpts = doc.querySelectorAll("trkpt");
        const points: { lat: number; lon: number; ele: number }[] = [];
        trkpts.forEach((pt) => {
          points.push({
            lat: parseFloat(pt.getAttribute("lat") || "0"),
            lon: parseFloat(pt.getAttribute("lon") || "0"),
            ele: parseFloat(pt.querySelector("ele")?.textContent || "0"),
          });
        });
        setTrackPoints(points);
      })
      .catch(err => console.error("Failed to fetch GPX:", err));
  }, [osmId]);

  const hoveredPosition = hoveredPointIndex !== null ? trackPoints[hoveredPointIndex] : null;

  if (!osmId) {
    return null;
  }

  const distanceKm = gpxStats ? (gpxStats.distance / 1000).toFixed(1) : null;
  const elevationGain = gpxStats ? Math.round(gpxStats.elevation_gain) : null;
  const elevationLoss = gpxStats ? Math.round(gpxStats.elevation_loss) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-end gap-3 mb-2">
        {isAuthenticated && (
          <button
            onClick={handleToggleWaypoints}
            className={`inline-flex items-center gap-1 text-sm ${showWaypoints ? "text-purple-600" : "text-black/80 hover:text-black"
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
            className={`px-2 py-1 text-xs rounded ${mapProvider === "osm"
              ? "bg-green-600 text-white"
              : "bg-white text-black hover:bg-gray-100"
              }`}
          >
            OSM
          </button>
          <button
            onClick={() => setMapProvider("icgc")}
            className={`px-2 py-1 text-xs rounded ${mapProvider === "icgc"
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
          <GPXLoader osmId={osmId} />
          <StatsLoader osmId={osmId} onStatsLoaded={handleStatsLoaded} />
          <WaypointsHandler showWaypoints={showWaypoints} waypoints={waypoints} setWaypoints={setWaypoints} />
          <HoverMarker position={hoveredPosition} />
        </MapContainer>
        {gpxStats && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 px-3 py-1 rounded-md text-sm flex items-center gap-2">
            <span>{distanceKm} km</span>
            <span className="mx-2 text-black/50">|</span>
            <span>+{elevationGain}m/-{elevationLoss}m</span>
            {isAuthenticated && (
              <button
                onClick={handleSaveStats}
                disabled={isSaving}
                className={`p-1 rounded hover:bg-gray-200 ${isSaving ? "text-gray-400" : "text-green-600"}`}
                title="Desa les estadístiques"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {gpxData && (
        <div className="relative z-[1001]">
          <ElevationChart
            gpxData={gpxData}
            trackPoints={trackPoints}
            onHoverPoint={setHoveredPointIndex}
          />
        </div>
      )}
    </div>
  );
}