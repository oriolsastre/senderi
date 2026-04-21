import { useEffect, useState } from "react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { Excursio as ExcursioType } from "../types/excursio";
import type { Waypoint } from "../api/waypoint";
import { updateWaypoint } from "../api/waypoint";
import { createWaypointIcon } from "../utils/waypointMarkers";
import { waypointTypeLabels } from "../types/waypoint";

interface WaypointsProps {
  excursion: ExcursioType;
  isAuthenticated: boolean;
}

export default function Waypoints({ excursion, isAuthenticated }: WaypointsProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    nom?: string;
    tipus?: string;
    lat?: number;
    lon?: number;
    elevacio?: number;
    comentari?: string;
    privat?: number;
    osm_node?: number;
    wikidata?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!excursion.id) return;
    fetch(`/api/excursions/${excursion.id}/waypoints`)
      .then(res => res.json())
      .then(setWaypoints)
      .finally(() => setLoading(false));
  }, [excursion.id]);

  const handleEditClick = (wp: Waypoint) => {
    setEditingId(wp.id);
    setEditForm({
      nom: wp.nom ?? undefined,
      tipus: wp.tipus,
      lat: wp.lat,
      lon: wp.lon,
      elevacio: wp.elevacio ?? undefined,
      comentari: wp.comentari ?? undefined,
      privat: wp.privat,
      osm_node: wp.osm_node ?? undefined,
      wikidata: wp.wikidata ?? undefined,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await updateWaypoint(editingId, editForm);
      setWaypoints(waypoints.map(wp => wp.id === editingId ? updated : wp));
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Failed to update waypoint:", err);
    }
    setSaving(false);
  };

  if (loading) return <div className="h-32 bg-gray-100 animate-pulse rounded-lg">Carregant punts...</div>;
  if (waypoints.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-serif font-semibold text-black mb-3">Punts d'interès</h2>
      <div className="space-y-1">
        {waypoints.map((wp) => (
          <div key={wp.id} className="py-1 rounded-lg">
            {editingId === wp.id ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={editForm.nom || ""}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value || undefined })}
                    placeholder="Nom"
                    className="flex-1 min-w-32 px-2 py-1 border rounded"
                    disabled={saving}
                  />
                  <select
                    value={editForm.tipus || "altres"}
                    onChange={(e) => setEditForm({ ...editForm, tipus: e.target.value })}
                    className="px-2 py-1 border rounded"
                    disabled={saving}
                  >
                    {Object.keys(waypointTypeLabels).map((key) => (
                      <option key={key} value={key}>{waypointTypeLabels[key as keyof typeof waypointTypeLabels]}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={editForm.elevacio ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, elevacio: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Elevació"
                    className="w-24 px-2 py-1 border rounded"
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    step="0.000001"
                    value={editForm.lat ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, lat: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Lat"
                    className="w-28 px-2 py-1 border rounded"
                    disabled={saving}
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={editForm.lon ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, lon: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Lon"
                    className="w-28 px-2 py-1 border rounded"
                    disabled={saving}
                  />
                  <input
                    type="number"
                    value={editForm.osm_node ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, osm_node: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="OSM Node"
                    className="w-24 px-2 py-1 border rounded"
                    disabled={saving}
                  />
                  <input
                    type="text"
                    value={editForm.wikidata ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, wikidata: e.target.value || undefined })}
                    placeholder="Wikidata"
                    className="w-24 px-2 py-1 border rounded"
                    disabled={saving}
                  />
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={editForm.privat === 1}
                      onChange={(e) => setEditForm({ ...editForm, privat: e.target.checked ? 1 : 0 })}
                      disabled={saving}
                    />
                    <span className="text-sm">Privat</span>
                  </label>
                </div>
                <textarea
                  value={editForm.comentari || ""}
                  onChange={(e) => setEditForm({ ...editForm, comentari: e.target.value || undefined })}
                  placeholder="Comentari"
                  className="w-full px-2 py-1 border rounded"
                  disabled={saving}
                />
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="p-1 text-green-600 hover:text-green-700 cursor-pointer">
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button onClick={handleCancelEdit} disabled={saving} className="p-1 text-red-600 hover:text-red-700 cursor-pointer">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: createWaypointIcon({ ...wp, tipus: wp.tipus || "altres" } as any).options.html || "" }}
                />
                <span className="text-black">{wp.nom || wp.tipus}</span>
                {wp.elevacio && <span className="text-black/60 text-sm">({wp.elevacio}m)</span>}
                {isAuthenticated && (
                  <button onClick={() => handleEditClick(wp)} className="ml-auto p-1 text-black/60 hover:text-black cursor-pointer">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}