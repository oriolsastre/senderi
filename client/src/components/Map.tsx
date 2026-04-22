import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-gpx";
import "proj4leaflet";
import { EyeIcon, EyeSlashIcon, CloudArrowUpIcon, PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { ElevationChart } from "./ElevationChart";
import { HoverMarker } from "./HoverMarker";
import { GPXLoader } from "./GPXLoader";
import { WaypointMarker } from "./WaypointMarker";
import { AddWaypointForm } from "./AddWaypointForm";
import { StatsLoader, type GPXStats } from "./StatsLoader";
import { WaypointsLayer } from "./WaypointsLayer";
import { AddWaypointFetcher } from "./AddWaypointFetcher";
import { WaypointsFetcher } from "./WaypointsFetcher";

import { updateExcursio } from "../api/excursio";
import type { Waypoint } from "../types/waypoint";

// @ts-ignore - proj4leaflet adds L.Proj.CRS
const crsICGC = new L.Proj.CRS(
  "EPSG:25831",
  "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  {
    resolutions: [1100, 550, 275, 100, 50, 25, 10, 5, 2, 1, 0.5, 0.25],
    origin: [0, 0],
  }
);

interface MapProps {
  id: number;
  osmId: number | null;
  slug: string;
  isAuthenticated: boolean;
}

export default function Map({ id, osmId, slug, isAuthenticated }: MapProps) {
  const [mapProvider, setMapProvider] = useState<"osm" | "icgc">("osm");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [showAddWaypoints, setShowAddWaypoints] = useState(false);
  const [showHikeWaypoints, setShowHikeWaypoints] = useState(true);
  const [addWaypoints, setAddWaypoints] = useState<Waypoint[]>([]);
  const [gpxStats, setGpxStats] = useState<GPXStats | null>(null);
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [trackPoints, setTrackPoints] = useState<{ lat: number; lon: number; ele: number }[]>([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPuntForm, setShowAddPuntForm] = useState(false);
  const [waypointPos, setWaypointPos] = useState<{ lat: number; lon: number; elevacio: number }>({ lat: 0, lon: 0, elevacio: 0 });

  const handleStatsLoaded = (stats: GPXStats) => {
    setGpxStats(stats);
  };

  const handleToggleAddWaypoints = () => {
    setShowAddWaypoints(!showAddWaypoints);
  };

  const handleToggleAddPuntForm = () => {
    setShowAddPuntForm(!showAddPuntForm);
    if (!showAddPuntForm && trackPoints.length > 0) {
      const midPoint = trackPoints[Math.floor(trackPoints.length / 2)];
      setWaypointPos({ lat: midPoint.lat, lon: midPoint.lon, elevacio: midPoint.ele });
    }
  };

  const handleTrackPointClick = (index: number | null) => {
    setHoveredPointIndex(index);
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
        {waypoints.length > 0 && (
          <button
            onClick={() => setShowHikeWaypoints(!showHikeWaypoints)}
className="inline-flex items-center gap-1 text-sm text-black/80 hover:text-black cursor-pointer"
          >
            {showHikeWaypoints ? (
              <>
                <EyeSlashIcon className="w-4 h-4" />
                Amaga punts de ruta
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" />
                Mostra punts de ruta
              </>
            )}
          </button>
        )}
        <a
          href={`/api/excursions/${osmId}/gpx?filename=${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-black/80 hover:text-black"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Descarrega (.gpx)
        </a>
      </div>
      <div className="h-[450px] w-full rounded-lg overflow-hidden relative">
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
          <GPXLoader osmId={osmId} trackPoints={trackPoints} onTrackPointClick={handleTrackPointClick} />
          {showAddPuntForm && (
            <WaypointMarker
              lat={waypointPos.lat}
              lon={waypointPos.lon}
              onMove={(lat, lon) => setWaypointPos(prev => ({ ...prev, lat, lon }))}
            />
          )}
          <StatsLoader osmId={osmId} onStatsLoaded={handleStatsLoaded} />
          <WaypointsFetcher waypoints={waypoints} setWaypoints={setWaypoints} excursioId={id} />
          <WaypointsLayer showWaypoints={showHikeWaypoints} waypoints={waypoints} isHikingMap={true} belongsToHike={true} />
          <AddWaypointFetcher showAddWaypoints={showAddWaypoints} setWaypoints={setAddWaypoints} excursioId={id} />
          <WaypointsLayer showWaypoints={showAddWaypoints} waypoints={addWaypoints} isHikingMap={true} belongsToHike={false} excursioId={id} isAuthenticated={isAuthenticated} />
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
      {isAuthenticated && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAddPuntForm}
            className={`inline-flex items-center gap-1 text-sm ${showAddPuntForm ? "text-green-600" : "text-black/80 hover:text-black"}`}
          >
            <PlusIcon className="w-4 h-4" />
            Afegir punt de ruta
          </button>
          <button
            onClick={handleToggleAddWaypoints}
            className={`inline-flex items-center gap-1 text-sm ${showAddWaypoints ? "text-purple-600" : "text-black/80 hover:text-black"}`}
          >
            <EyeIcon className="w-4 h-4" />
            {showAddWaypoints ? "Amaga punts (afegir)" : "Mostra punts (afegir)"}
          </button>
        </div>
      )}
      {showAddPuntForm && isAuthenticated && (
        <AddWaypointForm
          trackPoints={trackPoints}
          onClose={() => setShowAddPuntForm(false)}
          excursionId={id}
          waypointPos={waypointPos}
          onPosChange={setWaypointPos}
        />
      )}
      {gpxData && (
        <div className="relative z-[1001]">
          <ElevationChart
            gpxData={gpxData}
            trackPoints={trackPoints}
            onHoverPoint={setHoveredPointIndex}
            hoveredIndex={hoveredPointIndex}
          />
        </div>
      )}
    </div>
  );
}