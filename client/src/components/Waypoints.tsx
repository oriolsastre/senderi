import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { TrashIcon, PencilIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import type { Excursio as ExcursioType } from "../types/excursio";
import type { Waypoint } from "../types/waypoint";
import { updateWaypoint, removeWaypointFromExcursio, reorderExcursioWaypoints } from "../api/waypoint";
import { createWaypointIcon } from "../utils/waypointMarkers";
import { UpdateWaypointForm } from "./UpdateWaypointForm";

interface WaypointsProps {
  excursio: ExcursioType;
  isAuthenticated: boolean;
  fites?: Waypoint[];
}

export default function Waypoints({ excursio, isAuthenticated, fites }: WaypointsProps) {
  const [orderedWaypoints, setOrderedWaypoints] = useState<Waypoint[]>(fites || []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const originalOrder = useRef(fites || []);
  const isDirty = orderedWaypoints.some((wp, i) => wp.id !== (originalOrder.current[i]?.id));

  const waypoints = orderedWaypoints;

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
      setOrderedWaypoints(orderedWaypoints.filter(wp => wp.id !== waypointId));
    } catch (err) {
      console.error("Failed to remove waypoint:", err);
      alert("Error en eliminar el punt de l'excursió");
    }
  };

  const handleSaveEdit = async (waypointId: number, data: any) => {
    setSaving(true);
    try {
      await updateWaypoint(waypointId, data);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update waypoint:", err);
    }
    setSaving(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const items = [...orderedWaypoints];
    const dragged = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    setOrderedWaypoints(items);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSaveOrder = async () => {
    if (!excursio.id) return;
    setIsSavingOrder(true);
    try {
      const items = orderedWaypoints.map((wp, i) => ({ id: wp.id, ordre: i }));
      await reorderExcursioWaypoints(excursio.id, items);
      originalOrder.current = orderedWaypoints;
    } catch (err) {
      console.error("Failed to save order:", err);
      alert("Error en desar l'ordenació");
    }
    setIsSavingOrder(false);
  };

  if (waypoints.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-serif font-semibold text-black">Punts d'interès</h2>
        {isAuthenticated && isDirty && (
          <button
            onClick={handleSaveOrder}
            disabled={isSavingOrder}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer disabled:opacity-50"
          >
            {isSavingOrder ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
            Guardar ordenació
          </button>
        )}
      </div>
      <div className="space-y-1">
        {waypoints.map((wp, index) => (
          <div
            key={wp.id}
            {...(isAuthenticated ? {
              draggable: true,
              onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
              onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
              onDrop: handleDrop,
              onDragEnd: handleDragEnd,
            } : {})}
            className={`py-1 rounded-lg ${dragItem.current === index ? "opacity-50" : ""}`}
          >
            {editingId === wp.id ? (
              <UpdateWaypointForm
                 waypoint={wp}
                 saving={saving}
                 onSave={handleSaveEdit}
                 onCancel={handleCancelEdit}
               />
            ) : (
              <div className={`flex items-center gap-3 px-2 py-1 rounded-lg border border-transparent hover:border-purple-600 hover:shadow-[0_4px_12px_rgba(147,51,234,0.3)] transition-shadow ${wp.privat === 1 ? "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(147,51,234,0.2)_4px,rgba(147,51,234,0.2)_8px)]" : wp.excursio_privat === 1 ? "bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(147,51,234,0.2)_6px,rgba(147,51,234,0.2)_8px)]" : ""} ${isAuthenticated ? "cursor-grab active:cursor-grabbing" : ""}`}>
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