import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import "leaflet-gpx";
import { EyeIcon, EyeSlashIcon, CloudArrowUpIcon, PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import LeafletMap from "./LeafletMap";
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

function MapCenterGetter({ onCenter, enabled }: { onCenter: (center: any) => void; enabled: boolean }) {
  const map = useMap();
  const called = useRef(false);
  useEffect(() => {
    if (enabled && !called.current) {
      called.current = true;
      const center = map.getCenter();
      onCenter({ lat: center.lat, lon: center.lng });
    }
  }, [enabled, map, onCenter]);
  return null;
}

interface MapProps {
  id: number;
  osmId: number | null;
  slug: string;
  isAuthenticated: boolean;
}

export default function Map({ id, osmId, slug, isAuthenticated }: MapProps) {
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
  const [waypointPos, setWaypointPos] = useState<{ lat: number; lon: number; elevacio: number | null }>({ lat: 0, lon: 0, elevacio: null });

  const handleStatsLoaded = (stats: GPXStats) => {
    setGpxStats(stats);
  };

  const handleToggleAddWaypoints = () => {
    setShowAddWaypoints(!showAddWaypoints);
  };

  const handleToggleAddPuntForm = () => {
    setShowAddPuntForm(!showAddPuntForm);
  };

  const handleMapCenter = (center: { lat: number; lon: number }) => {
    setWaypointPos({ lat: center.lat, lon: center.lon, elevacio: waypointPos.elevacio });
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
      <div className="relative h-[450px]">
        <LeafletMap className="h-full w-full">
          <GPXLoader osmId={osmId} trackPoints={trackPoints} onTrackPointClick={handleTrackPointClick} />
          <MapCenterGetter onCenter={handleMapCenter} enabled={showAddPuntForm} />
          {showAddPuntForm && (
            <WaypointMarker
              lat={waypointPos.lat}
              lon={waypointPos.lon}
              onMove={(lat, lon) => setWaypointPos(prev => ({ ...prev, lat, lon }))}
            />
          )}
          <StatsLoader osmId={osmId} onStatsLoaded={handleStatsLoaded} />
          <WaypointsFetcher waypoints={waypoints} setWaypoints={setWaypoints} excursioId={id} />
          <WaypointsLayer showWaypoints={showHikeWaypoints} waypoints={waypoints} isHikingMap={true} belongsToHike={true} excursioId={id} isAuthenticated={isAuthenticated} />
          <AddWaypointFetcher showAddWaypoints={showAddWaypoints} setWaypoints={setAddWaypoints} excursioId={id} />
          <WaypointsLayer showWaypoints={showAddWaypoints} waypoints={addWaypoints} isHikingMap={true} belongsToHike={false} excursioId={id} isAuthenticated={isAuthenticated} />
          <HoverMarker position={hoveredPosition} />
        </LeafletMap>
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