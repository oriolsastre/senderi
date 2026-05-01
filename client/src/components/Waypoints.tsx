import { useEffect, useState } from "react";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import type { Excursio as ExcursioType } from "../types/excursio";
import type { Waypoint } from "../api/waypoint";
import { updateWaypoint, removeWaypointFromExcursio } from "../api/waypoint";
import { createWaypointIcon } from "../utils/waypointMarkers";
import { UpdateWaypointForm } from "./UpdateWaypointForm";

interface WaypointsProps {
  excursion: ExcursioType;
  isAuthenticated: boolean;
}

export default function Waypoints({ excursion, isAuthenticated }: WaypointsProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
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
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleRemoveFromHike = async (waypointId: number) => {
    if (!excursion.id) return;
    if (!confirm("Segur que vols eliminar aquest punt de l'excursió?")) return;
    try {
      await removeWaypointFromExcursio(excursion.id, waypointId);
      setWaypoints(waypoints.filter(wp => wp.id !== waypointId));
    } catch (err) {
      console.error("Failed to remove waypoint:", err);
      alert("Error en eliminar el punt de l'excursió");
    }
  };

  const handleSaveEdit = async (waypointId: number, data: any) => {
    setSaving(true);
    try {
      const updated = await updateWaypoint(waypointId, data);
      setWaypoints(waypoints.map(wp => wp.id === waypointId ? updated : wp));
      setEditingId(null);
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
              <UpdateWaypointForm
                 waypoint={wp}
                 saving={saving}
                 onSave={handleSaveEdit}
                 onCancel={handleCancelEdit}
               />
            ) : (
              <div className={`flex items-center gap-3 px-2 py-1 rounded-lg ${wp.privat === 1 ? "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(147,51,234,0.2)_4px,rgba(147,51,234,0.2)_8px)]" : wp.excursio_privat === 1 ? "bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(147,51,234,0.2)_6px,rgba(147,51,234,0.2)_8px)]" : ""}`}>
                <div
                  className="w-6 h-6 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: createWaypointIcon({ ...wp, tipus: wp.tipus || "altres" }).options.html || "" }}
                />
                <span className="text-black">{wp.nom || wp.tipus}</span>
                {wp.elevacio !== undefined && wp.elevacio !== null && <span className="text-black/60 text-sm">({wp.elevacio}m)</span>}
                {isAuthenticated && (
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => handleEditClick(wp)} className="p-1 text-black/60 hover:text-black cursor-pointer" title="Edita">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemoveFromHike(wp.id)} className="p-1 text-red-600 hover:text-red-700 cursor-pointer" title="Elimina de l'excursió">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}