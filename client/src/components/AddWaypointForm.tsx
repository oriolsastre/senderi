import { useState, useEffect } from "react";
import { WaypointTypes, waypointTypeLabels } from "../types/waypoint";
import { createWaypoint } from "../api/waypoint";

interface AddWaypointFormProps {
  trackPoints: { lat: number; lon: number; ele: number }[];
  onClose: () => void;
  excursionId: number;
  waypointPos: { lat: number; lon: number; elevacio: number };
  onPosChange: (pos: { lat: number; lon: number; elevacio: number }) => void;
}

export function AddWaypointForm({ trackPoints, onClose, excursionId, waypointPos, onPosChange }: AddWaypointFormProps) {
  const [newWaypoint, setNewWaypoint] = useState<{
    nom: string;
    tipus: string;
    lat: number;
    lon: number;
    elevacio: number;
    comentari: string;
    privat: number;
    osm_node?: number;
    wikidata?: number;
  }>({
    nom: "",
    tipus: WaypointTypes.CIM,
    lat: waypointPos.lat,
    lon: waypointPos.lon,
    elevacio: waypointPos.elevacio,
    comentari: "",
    privat: 0,
    osm_node: undefined,
    wikidata: undefined,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setNewWaypoint(prev => ({
      ...prev,
      lat: waypointPos.lat,
      lon: waypointPos.lon,
      elevacio: waypointPos.elevacio,
    }));
  }, [waypointPos]);

  const updatePos = (lat: number, lon: number, elevacio: number) => {
    setNewWaypoint(prev => ({ ...prev, lat, lon, elevacio }));
    onPosChange({ lat, lon, elevacio });
  };

  const handleCreate = async () => {
    if (!newWaypoint.nom) return;
    setIsCreating(true);
    try {
      await createWaypoint({
        nom: newWaypoint.nom,
        tipus: newWaypoint.tipus,
        lat: newWaypoint.lat,
        lon: newWaypoint.lon,
        elevacio: newWaypoint.elevacio || undefined,
        comentari: newWaypoint.comentari || undefined,
        privat: newWaypoint.privat,
        osm_node: newWaypoint.osm_node,
        wikidata: newWaypoint.wikidata,
      });
      alert("Punt de ruta creat!");
      onClose();
      setNewWaypoint({ nom: "", tipus: WaypointTypes.CIM, lat: 0, lon: 0, elevacio: 0, comentari: "", privat: 0, osm_node: undefined, wikidata: undefined });
    } catch (err) {
      console.error("Failed to create waypoint:", err);
      alert("Error en crear el punt de ruta");
    }
    setIsCreating(false);
  };

  return (
    <div className="bg-green-900/30 p-4 rounded-lg border border-black/20 space-y-3">
      <h3 className="font-semibold">Nou punt de ruta</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-3">
          <label className="block text-sm font-bold">Nom</label>
          <input
            type="text"
            value={newWaypoint.nom}
            onChange={(e) => setNewWaypoint({ ...newWaypoint, nom: e.target.value })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-bold">Tipus</label>
          <select
            value={newWaypoint.tipus}
            onChange={(e) => setNewWaypoint({ ...newWaypoint, tipus: e.target.value })}
            className="w-full border rounded px-2 py-1"
          >
            {(Object.keys(waypointTypeLabels) as Array<keyof typeof waypointTypeLabels>).map((key) => (
              <option key={key} value={key}>
                {waypointTypeLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold">Latitud</label>
          <input
            type="number"
            step="0.000001"
            value={newWaypoint.lat}
            onChange={(e) => updatePos(parseFloat(e.target.value), newWaypoint.lon, newWaypoint.elevacio)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-bold">Longitud</label>
          <input
            type="number"
            step="0.000001"
            value={newWaypoint.lon}
            onChange={(e) => updatePos(newWaypoint.lat, parseFloat(e.target.value), newWaypoint.elevacio)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-bold">Elevació (m)</label>
          <input
            type="number"
            value={newWaypoint.elevacio}
            onChange={(e) => updatePos(newWaypoint.lat, newWaypoint.lon, parseFloat(e.target.value))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 col-span-3 sm:col-span-4">
          <div>
            <label className="block text-sm font-bold">OSM Node</label>
            <input
              type="number"
              value={newWaypoint.osm_node || ""}
              onChange={(e) => setNewWaypoint({ ...newWaypoint, osm_node: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-bold">Wikidata</label>
            <input
              type="number"
              value={newWaypoint.wikidata || ""}
              onChange={(e) => setNewWaypoint({ ...newWaypoint, wikidata: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold">Comentari</label>
        <textarea
          value={newWaypoint.comentari}
          onChange={(e) => setNewWaypoint({ ...newWaypoint, comentari: e.target.value })}
          className="w-full border rounded px-2 py-1 h-20 resize-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="privat-waypoint"
          checked={newWaypoint.privat === 1}
          onChange={(e) => setNewWaypoint({ ...newWaypoint, privat: e.target.checked ? 1 : 0 })}
        />
        <label htmlFor="privat-waypoint" className="text-sm font-bold">Privat</label>
      </div>
      <button
        onClick={handleCreate}
        disabled={isCreating || !newWaypoint.nom}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isCreating ? "Creant..." : "Crear punt"}
      </button>
    </div>
  );
}