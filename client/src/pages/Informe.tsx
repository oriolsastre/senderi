import { useState, useRef, useCallback, useEffect } from "react";
import { useMap } from "react-leaflet";
import { DocumentTextIcon, CheckIcon, TrashIcon, PlusIcon, ViewfinderCircleIcon } from "@heroicons/react/24/solid";
import L from "leaflet";
import LeafletMap from "../components/LeafletMap";
import { GPXLoader } from "../components/GPXLoader";
import { HoverMarker } from "../components/HoverMarker";
import { ElevationChart } from "../components/ElevationChart";
import INaturalist from "../components/INaturalist";
import { parseGPX, computeGPXStats, extractTimeInfo } from "../utils/gpxClientParser";
import type { GPXStats } from "../utils/gpxClientParser";
import { createWaypointIcon, getIconUrl } from "../utils/waypointMarkers";
import { waypointIconMap } from "../types/waypoint";
import { generateInformePDF } from "../utils/generatePDF";
import { svgHtmlToPng, imgFileToPng, type LocalWaypoint } from "../utils/printUtils";

function InformeWaypointsMarkers({ waypoints, onDragEnd }: { waypoints: LocalWaypoint[]; onDragEnd: (id: string, lat: number, lon: number) => void }) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  useEffect(() => {
    const currentIds = new Set(waypoints.map(w => w.id));

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    waypoints.forEach(wp => {
      const icon = createWaypointIcon({
        id: 0, nom: null, elevacio: 5000,
        lat: wp.lat, lon: wp.lon, tipus: wp.tipus,
        comentari: null, descripcio: null,
        wikidata: null, osm_node: null, privat: 0,
      });

      const existing = markersRef.current.get(wp.id);
      if (existing) {
        existing.setLatLng([wp.lat, wp.lon]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([wp.lat, wp.lon], { draggable: true, icon })
          .on("dragend", () => {
            const pos = marker.getLatLng();
            onDragEndRef.current(wp.id, pos.lat, pos.lng);
          })
          .addTo(map);
        markersRef.current.set(wp.id, marker);
      }
    });

    return () => {
      markersRef.current.forEach(marker => map.removeLayer(marker));
      markersRef.current.clear();
    };
  }, [waypoints, map]);

  return null;
}

function MapCapture({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; return () => { mapRef.current = null; }; }, [map]);
  return null;
}

export default function Informe() {
  const [title, setTitle] = useState("Nou informe");
  const [gpxSource, setGpxSource] = useState<"file" | "osm">("file");
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [trackPoints, setTrackPoints] = useState<{ lat: number; lon: number; ele: number }[]>([]);
  const [stats, setStats] = useState<GPXStats | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [inatFormUsername, setInatFormUsername] = useState("");
  const [inatSubmitted, setInatSubmitted] = useState<{ username: string; sDate: string; eDate: string } | null>(null);
  const [osmIdInput, setOsmIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [localWaypoints, setLocalWaypoints] = useState<LocalWaypoint[]>([]);
  const [editingIconId, setEditingIconId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const processGpxData = useCallback((text: string) => {
    setGpxData(text);
    setError(null);
    const points = parseGPX(text);
    setTrackPoints(points);
    const s = computeGPXStats(points);
    setStats(s);
    const time = extractTimeInfo(points, text);
    setStartDate(time.startDate);
    setEndDate(time.endDate);
    setDuration(time.duration);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("El fitxer ha de ser un GPX");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      processGpxData(e.target?.result as string);
      setLoading(false);
    };
    reader.onerror = () => {
      setError("Error llegint el fitxer");
      setLoading(false);
    };
    reader.readAsText(file);
  }, [processGpxData]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleOsmIdLoad = useCallback(async () => {
    const id = parseInt(osmIdInput);
    if (!id || isNaN(id)) {
      setError("Introdueix un ID vàlid");
      return;
    }
    setLoading(true);
    setError(null);
    setGpxData(null);
    setStats(null);
    setStartDate("");
    setEndDate("");
    setDuration("");
    setTrackPoints([]);
    try {
      const res = await fetch(`/api/excursions/${id}/gpx`);
      if (!res.ok) throw new Error("Failed to fetch");
      const text = await res.text();
      processGpxData(text);
    } catch {
      setError("Error carregant el GPX d'OSM");
    } finally {
      setLoading(false);
    }
  }, [osmIdInput, processGpxData]);

  const handleGpxSourceChange = useCallback((source: "file" | "osm") => {
    setGpxSource(source);
    setGpxData(null);
    setStats(null);
    setTrackPoints([]);
    setStartDate("");
    setEndDate("");
    setDuration("");
    setError(null);
  }, []);

  const handleChangeGpx = useCallback(() => {
    setGpxData(null);
    setStats(null);
    setTrackPoints([]);
    setStartDate("");
    setEndDate("");
    setDuration("");
    setError(null);
  }, []);

  const handleInatSubmit = useCallback(() => {
    if (!inatFormUsername || !startDate) return;
    setInatSubmitted({ username: inatFormUsername, sDate: startDate, eDate: endDate });
  }, [inatFormUsername, startDate, endDate]);

  const handleInatEdit = useCallback(() => {
    if (!inatSubmitted) return;
    setInatFormUsername(inatSubmitted.username);
    setStartDate(inatSubmitted.sDate);
    setEndDate(inatSubmitted.eDate);
    setInatSubmitted(null);
  }, [inatSubmitted]);

  const distanciaKm = stats ? (stats.distance / 1000).toFixed(1) : null;

  const handlePrint = useCallback(async () => {
    if (isGeneratingPDF || !mapRef.current || !chartRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const statsParts: string[] = [];
      if (startDate) {
        statsParts.push(`${startDate}${endDate && endDate !== startDate ? ` — ${endDate}` : ""}${duration ? ` · ${duration}` : ""}`);
      }
      if (distanciaKm) statsParts.push(`${distanciaKm} km`);
      if (stats) statsParts.push(`+${stats.elevation_gain}m / -${stats.elevation_loss}m`);

      const waypointPdfData = await Promise.all(localWaypoints.map(async (wp) => {
        const tipus = wp.tipus?.toLowerCase();
        let iconPngDataUrl: string | null = null;
        if (tipus === "cim" || tipus === "coll") {
          const svgHtml = createWaypointIcon({
            id: 0, nom: null, elevacio: 5000,
            lat: wp.lat, lon: wp.lon, tipus: wp.tipus,
            comentari: null, descripcio: null,
            wikidata: null, osm_node: null, privat: 0,
          }).options.html || "";
          iconPngDataUrl = await svgHtmlToPng(svgHtml as string);
        } else {
          iconPngDataUrl = await imgFileToPng(getIconUrl(wp.tipus), 48);
        }
        return { id: wp.id, nom: wp.nom, descripcio: wp.descripcio, iconPngDataUrl };
      }));

      const blob = await generateInformePDF({
        title,
        statsText: statsParts.join(" · "),
        description,
        waypoints: waypointPdfData,
        mapElement: mapRef.current,
        chartElement: chartRef.current,
        inatParams: inatSubmitted ? {
          userId: inatSubmitted.username,
          dateInici: inatSubmitted.sDate,
          dateFinal: inatSubmitted.eDate,
        } : undefined,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError(err instanceof Error ? err.message : "Error generant el PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [title, stats, startDate, endDate, duration, distanciaKm, description, localWaypoints, inatSubmitted, isGeneratingPDF]);

  const handleAddWaypoint = useCallback(() => {
    const pos = trackPoints.length > 0
      ? trackPoints[Math.floor(trackPoints.length / 2)]
      : { lat: 41.469197, lon: 2.061967, ele: 0 };
    const newWp: LocalWaypoint = {
      id: crypto.randomUUID(),
      lat: pos.lat,
      lon: pos.lon,
      nom: "",
      descripcio: "",
      tipus: "altres",
    };
    setLocalWaypoints(prev => [...prev, newWp]);
  }, [trackPoints]);

  const handleDeleteWaypoint = useCallback((id: string) => {
    setLocalWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);

  const handleWaypointDrag = useCallback((id: string, lat: number, lon: number) => {
    setLocalWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, lat, lon } : wp));
  }, []);

  const handleChangeTipus = useCallback((id: string, tipus: string) => {
    setLocalWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, tipus } : wp));
  }, []);

  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setEditingIconId(null);
      }
    };
    if (editingIconId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingIconId]);

  return (
    <div className="py-4 space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-text { border: none !important; background: transparent !important; padding: 0 !important; color: #000 !important; box-shadow: none !important; resize: none !important; height: auto !important; }
          .print-text::placeholder { color: transparent !important; }
          .print-map { height: 300px !important; }
        }
      `}</style>

      <div className="flex items-center gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-serif font-bold text-black w-full bg-transparent print-text"
        />
      </div>

      {!gpxData ? (
        <div className="no-print space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleGpxSourceChange("file")}
              className={`px-3 py-1.5 text-sm rounded cursor-pointer ${gpxSource === "file" ? "bg-purple-600 text-white" : "bg-white text-black/80 hover:bg-gray-100"}`}
            >
              Fitxer GPX
            </button>
            <button
              onClick={() => handleGpxSourceChange("osm")}
              className={`px-3 py-1.5 text-sm rounded cursor-pointer ${gpxSource === "osm" ? "bg-purple-600 text-white" : "bg-white text-black/80 hover:bg-gray-100"}`}
            >
              OSM Trace
            </button>
          </div>

          {gpxSource === "file" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-purple-600 bg-purple-50" : "border-black/30 hover:border-purple-400"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                onChange={handleFileInput}
                className="hidden"
              />
              <p className="text-black/70">Arrossega un fitxer GPX aquí o fes clic per seleccionar-lo</p>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={osmIdInput}
                onChange={(e) => setOsmIdInput(e.target.value)}
                placeholder="ID del trace d'OSM"
                className="flex-1 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
              />
              <button
                onClick={handleOsmIdLoad}
                disabled={loading || !osmIdInput}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
              >
                Carrega
              </button>
            </div>
          )}

          {error && <p className="text-red-400">{error}</p>}
          {loading && <p className="text-black/80">Carregant...</p>}
        </div>
      ) : (
        <>
          {error && <p className="text-red-400">{error}</p>}
          {loading && <p className="text-black/80">Carregant...</p>}

          {stats && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xl text-black/80 -mt-4">
              {startDate && (
                <span>{startDate}{endDate && endDate !== startDate ? ` — ${endDate}` : ""}{duration && ` · ${duration}`}</span>
              )}
              <span>{distanciaKm} km</span>
              <span className="text-black/60">+{stats.elevation_gain}m / -{stats.elevation_loss}m</span>
            </div>
          )}

          <div>
            <div className="flex justify-end mb-1 no-print">
              <button onClick={handleChangeGpx} className="p-1 text-black/60 hover:text-black cursor-pointer" title="Canvia el fitxer GPX">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <div ref={mapRef} className="h-[450px] rounded-lg overflow-hidden print-map">
              <LeafletMap className="h-full w-full">
                <GPXLoader gpxData={gpxData} trackPoints={trackPoints} />
                <HoverMarker position={hoveredPointIndex !== null ? trackPoints[hoveredPointIndex] : null} />
                <InformeWaypointsMarkers waypoints={localWaypoints} onDragEnd={handleWaypointDrag} />
                <MapCapture mapRef={leafletMapRef} />
              </LeafletMap>
            </div>
            <div className="flex justify-center mt-2 no-print">
              <button
                onClick={() => {
                  const map = leafletMapRef.current;
                  if (!map || trackPoints.length === 0) return;
                  const bounds = L.latLngBounds(trackPoints.map(p => [p.lat, p.lon]));
                  localWaypoints.forEach(wp => bounds.extend([wp.lat, wp.lon]));
                  map.fitBounds(bounds);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm"
                title="Centra el mapa a tot el recorregut"
              >
                <ViewfinderCircleIcon className="w-5 h-5" />
                Centra
              </button>
            </div>
            <div ref={chartRef} className="mt-2">
              <ElevationChart gpxData={gpxData} trackPoints={trackPoints} onHoverPoint={setHoveredPointIndex} hoveredIndex={hoveredPointIndex} />
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="text-lg font-serif font-semibold text-black mb-2">Descripció</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descriu la teva excursió..."
          className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg min-h-[100px] print-text"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-lg font-serif font-semibold text-black">Punts d'interès</h2>
          <button onClick={handleAddWaypoint} className="p-1 text-black/60 hover:text-black cursor-pointer no-print" title="Afegeix un punt">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        {localWaypoints.length > 0 && (
          <div className="space-y-1 mb-6">
            {localWaypoints.map(wp => (
              <div key={wp.id} className="flex items-center gap-2 px-2 py-1 rounded-lg border border-transparent hover:border-purple-600 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] transition-shadow">
                  <div className="relative" ref={iconPickerRef}>
                    <button onClick={() => setEditingIconId(editingIconId === wp.id ? null : wp.id)} className="w-6 h-6 flex items-center justify-center cursor-pointer">
                      <img src={getIconUrl(wp.tipus)} className="w-6 h-6" alt="" />
                    </button>
                  {editingIconId === wp.id && (
                    <div className="absolute top-full left-0 z-50 bg-white border border-purple-500 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 min-w-32">
                      {Object.keys(waypointIconMap).map(tipus => (
                        <button key={tipus} onClick={() => { handleChangeTipus(wp.id, tipus); setEditingIconId(null); }} className="p-1 hover:bg-purple-100 rounded cursor-pointer flex items-center justify-center">
                          <img src={getIconUrl(tipus)} className="w-6 h-6" alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <input
                    type="text"
                    value={wp.nom}
                    onChange={(e) => setLocalWaypoints(prev => prev.map(p => p.id === wp.id ? { ...p, nom: e.target.value } : p))}
                    placeholder="Títol"
                    className="min-w-0 px-2 py-1 bg-transparent text-black placeholder-black/40 print-text"
                  />
                  <input
                    type="text"
                    value={wp.descripcio}
                    onChange={(e) => setLocalWaypoints(prev => prev.map(p => p.id === wp.id ? { ...p, descripcio: e.target.value } : p))}
                    placeholder="Descripció"
                    className="min-w-0 px-2 py-1 bg-transparent text-black/70 text-sm placeholder-black/40 print-text"
                  />
                </div>
                <button onClick={() => handleDeleteWaypoint(wp.id)} className="p-1 text-red-600 hover:text-red-700 cursor-pointer no-print" title="Elimina">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {!inatSubmitted ? (
          <div className="no-print">
            <h2 className="text-lg font-serif font-semibold text-black">Observacions iNaturalist</h2>
            <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-black/60 mb-1">Nom d'usuari</label>
              <input
                type="text"
                value={inatFormUsername}
                onChange={(e) => setInatFormUsername(e.target.value)}
                placeholder="usuari"
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-black/60 mb-1">Data inici</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-black/60 mb-1">Data final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
              />
            </div>
            <button
              onClick={handleInatSubmit}
              disabled={!inatFormUsername || !startDate}
              className="p-2 text-white rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Carrega observacions"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        ) : (
          <>
            <div className="flex justify-end no-print">
              <button onClick={handleInatEdit} className="p-1 text-black/60 hover:text-black cursor-pointer" title="Esborra les observacions">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <INaturalist userId={inatSubmitted.username} dateInici={inatSubmitted.sDate} dateFinal={inatSubmitted.eDate} />
          </>
        )}
      </div>

      <div className="no-print flex justify-center pt-4">
        <button
          onClick={handlePrint}
          disabled={isGeneratingPDF || !gpxData}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-lg"
        >
          <DocumentTextIcon className="w-5 h-5" />
          {isGeneratingPDF ? "Generant PDF..." : "Imprimeix informe"}
        </button>
      </div>
    </div>
  );
}
