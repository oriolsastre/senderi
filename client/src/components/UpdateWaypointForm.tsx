import { useState } from "react";
import type { Waypoint } from "../types/waypoint";
import { waypointTypeLabels } from "../types/waypoint";
import { CheckIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

interface UpdateWaypointFormProps {
  waypoint: Waypoint;
  saving: boolean;
  onSave: (id: number, data: any) => void;
  onCancel: () => void;
}

export function UpdateWaypointForm({ 
  waypoint, 
  saving, 
  onSave, 
  onCancel,
}: UpdateWaypointFormProps) {
  const [editForm, setEditForm] = useState<{
    nom: string;
    tipus: string;
    lat?: number;
    lon?: number;
    elevacio?: number | null;
    comentari?: string;
    descripcio?: string;
    privat?: number;
    osm_node?: number;
    wikidata?: string;
  }>({
    nom: waypoint.nom || "",
    tipus: waypoint.tipus,
    lat: waypoint.lat,
    lon: waypoint.lon,
    elevacio: waypoint.elevacio ?? undefined,
    comentari: waypoint.comentari ?? undefined,
    descripcio: waypoint.descripcio ?? undefined,
    privat: waypoint.privat,
    osm_node: waypoint.osm_node ?? undefined,
    wikidata: waypoint.wikidata ?? undefined,
  });

  const handleSave = () => {
    onSave(waypoint.id, {
      nom: editForm.nom.trim(),
      tipus: editForm.tipus,
      lat: editForm.lat,
      lon: editForm.lon,
      elevacio: editForm.elevacio,
      comentari: editForm.comentari === "" ? null : editForm.comentari,
      descripcio: editForm.descripcio === "" ? null : editForm.descripcio,
      privat: editForm.privat,
      osm_node: editForm.osm_node,
      wikidata: editForm.wikidata,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          value={editForm.nom}
          onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
           className="flex-1 min-w-48 px-3 py-2 bg-white/90 text-gray-900 border border-gray-300 rounded-lg focus:border-purple-600"
          disabled={saving}
          autoFocus
        />
        <select
          value={editForm.tipus}
          onChange={(e) => setEditForm({ ...editForm, tipus: e.target.value })}
           className="px-3 py-2 bg-white/90 text-gray-900 border border-gray-300 rounded-lg focus:border-purple-600"
          disabled={saving}
        >
          {(Object.keys(waypointTypeLabels) as Array<keyof typeof waypointTypeLabels>).map((key) => (
            <option key={key} value={key}>
              {waypointTypeLabels[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="number"
          value={editForm.lat ?? ""}
          onChange={(e) => setEditForm({ ...editForm, lat: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="Lat"
           className="w-48 px-2 py-1 bg-white/90 border border-gray-300 rounded-lg focus:border-purple-600"
           disabled={saving}
         />
         <input
           type="number"
           value={editForm.lon ?? ""}
           onChange={(e) => setEditForm({ ...editForm, lon: e.target.value ? parseFloat(e.target.value) : undefined })}
           placeholder="Lon"
           className="w-48 px-2 py-1 bg-white/90 border border-gray-300 rounded-lg focus:border-purple-600"
          disabled={saving}
        />
        <input
          type="number"
          value={editForm.elevacio ?? ""}
          onChange={(e) => setEditForm({ ...editForm, elevacio: e.target.value ? Number(e.target.value) : null })}
           className="w-24 px-3 py-2 bg-white/90 text-gray-900 border border-gray-300 rounded-lg focus:border-purple-600"
          disabled={saving}
          placeholder="Elevació"
        />
        <span className="text-black/80">m</span>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="number"
          value={editForm.osm_node ?? ""}
          onChange={(e) => setEditForm({ ...editForm, osm_node: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="OSM Node"
           className="w-48 px-2 py-1 bg-white/90 border border-gray-300 rounded-lg focus:border-purple-600"
           disabled={saving}
         />
         <input
           type="text"
           value={editForm.wikidata ?? ""}
           onChange={(e) => setEditForm({ ...editForm, wikidata: e.target.value || undefined })}
           placeholder="Wikidata"
           className="w-48 px-2 py-1 bg-white/90 border border-gray-300 rounded-lg focus:border-purple-600"
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

      <div className="space-y-2">
        <div>
          <label className="text-black/80 text-sm font-bold">Descripció</label>
          <textarea
            value={editForm.descripcio || ""}
             onChange={(e) => setEditForm({ ...editForm, descripcio: e.target.value })}
             className="w-full px-3 py-2 bg-white/90 text-gray-900 border border-gray-300 rounded-lg min-h-[80px] focus:border-purple-600"
             disabled={saving}
           />
         </div>
          <div>
            <label className="text-black/80 text-sm font-bold">Comentari (privat)</label>
            <textarea
              value={editForm.comentari || ""}
               onChange={(e) => setEditForm({ ...editForm, comentari: e.target.value })}
              className="w-full px-3 py-2 bg-white/90 text-gray-900 border border-gray-300 rounded-lg min-h-[80px] focus:border-purple-600"
              disabled={saving}
            />
          </div>
      </div>

      <div className="flex items-center gap-2">
        {saving ? (
          <div className="p-2">
            <ArrowPathIcon className="h-6 w-6 text-black/80 animate-spin" />
          </div>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-2 text-black/80 hover:text-black cursor-pointer"
            >
              <CheckIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-black/80 hover:text-black cursor-pointer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
