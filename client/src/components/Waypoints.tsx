import { useState } from "react";
import { Link } from "react-router-dom";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import type { Excursio as ExcursioType } from "../types/excursio";
import type { Waypoint } from "../types/waypoint";
import { updateWaypoint, removeWaypointFromExcursio } from "../api/waypoint";
import { createWaypointIcon } from "../utils/waypointMarkers";
import { UpdateWaypointForm } from "./UpdateWaypointForm";

interface WaypointsProps {
  excursio: ExcursioType;
  isAuthenticated: boolean;
  fites?: Waypoint[];
}

export default function Waypoints({ excursio, isAuthenticated, fites }: WaypointsProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const waypoints = fites || [];

  const handleEditClick = (wp: Waypoint) => {
    setEditingId(wp.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleRemoveFromHike = async (waypointId: number) => {
    if (!excursio.id) return;
    if (!confirm("Segur que vols eliminar aquest punt de l'excursió?")) return;
    try {
      await removeWaypointFromExcursio(excursio.id, waypointId);
      window.location.reload();
    } catch (err) {
      console.error("Failed to remove waypoint:", err);
      alert("Error en eliminar el punt de l'excursió");
    }
  };

  const handleSaveEdit = async (waypointId: number, data: any) => {
    setSaving(true);
    try {
      await updateWaypoint(waypointId, data);
      window.location.reload();
    } catch (err) {
      console.error("Failed to update waypoint:", err);
    }
    setSaving(false);
  };

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
              <div className={`flex items-center gap-3 px-2 py-1 rounded-lg border border-transparent hover:border-purple-600 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] transition-shadow ${wp.privat === 1 ? "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(147,51,234,0.2)_4px,rgba(147,51,234,0.2)_8px)]" : wp.excursio_privat === 1 ? "bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(147,51,234,0.2)_6px,rgba(147,51,234,0.2)_8px)]" : ""}`}>
<Link to={`/fita/${wp.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 rounded px-1">
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: createWaypointIcon({ ...wp, tipus: wp.tipus || "altres" }).options.html || "" }}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-black truncate">{wp.nom || wp.tipus}</span>
                        {wp.elevacio !== undefined && wp.elevacio !== null && <span className="text-black/60 text-sm">({wp.elevacio}m)</span>}
                      </div>
                      {wp.descripcio && <span className="text-black/70 text-sm truncate">{wp.descripcio}</span>}
                    </div>
                  </Link>
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