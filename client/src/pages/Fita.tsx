import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PencilIcon, CheckIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { getWaypoint, updateWaypoint, getExcursionsByWaypoint } from "../api/waypoint";
import type { WaypointExcursio } from "../api/waypoint";
import type { Waypoint } from "../types/waypoint";
import { waypointTypeLabels } from "../types/waypoint";
import { createWaypointIcon } from "../utils/waypointMarkers";
import LeafletMap from "../components/LeafletMap";
import { Marker } from "react-leaflet";

interface FitaProps {
  isAuthenticated: boolean;
}

export default function Fita({ isAuthenticated }: FitaProps) {
  const { id } = useParams<{ id: string }>();
  const [waypoint, setWaypoint] = useState<Waypoint | null>(null);
  const [excursions, setExcursions] = useState<WaypointExcursio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedNom, setEditedNom] = useState("");
  const [editedTipus, setEditedTipus] = useState("");
  const [editedElevacio, setEditedElevacio] = useState<number | null>(null);
  const [editedDescripcio, setEditedDescripcio] = useState("");
  const [editedComentari, setEditedComentari] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const waypointId = parseInt(id);
    if (isNaN(waypointId)) {
      setError("ID invàlid");
      setLoading(false);
      return;
    }

    Promise.all([
      getWaypoint(waypointId),
      getExcursionsByWaypoint(waypointId),
    ])
      .then(([wp, excs]) => {
        const typedWp: Waypoint = {
          ...wp,
          comentari: wp.comentari || undefined,
          descripcio: wp.descripcio || undefined,
          wikidata: wp.wikidata || undefined,
          osm_node: wp.osm_node || undefined,
          privat: wp.privat || undefined,
        };
        setWaypoint(typedWp);
        setExcursions(excs);
      })
      .catch(() => setError("Waypoint no trobat"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditClick = () => {
    if (!waypoint) return;
    setEditedNom(waypoint.nom || "");
    setEditedTipus(waypoint.tipus);
    setEditedElevacio(waypoint.elevacio || null);
    setEditedDescripcio(waypoint.descripcio || "");
    setEditedComentari(waypoint.comentari || "");
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedNom("");
    setEditedTipus("");
    setEditedElevacio(null);
    setEditedDescripcio("");
    setEditedComentari("");
    setSaveError(null);
  };

  const handleConfirm = async () => {
    if (!waypoint?.id || !editedNom.trim()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updated = await updateWaypoint(waypoint.id, {
        nom: editedNom.trim(),
        tipus: editedTipus,
        elevacio: editedElevacio,
        descripcio: editedDescripcio,
        comentari: editedComentari,
      });
      const typedUpdated: Waypoint = {
        ...updated,
        comentari: updated.comentari || undefined,
        descripcio: updated.descripcio || undefined,
        wikidata: updated.wikidata || undefined,
        osm_node: updated.osm_node || undefined,
        privat: updated.privat || undefined,
      };
      setWaypoint(typedUpdated);
      setIsEditing(false);
    } catch {
      setSaveError("Error en desar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-4 text-black">Loading...</div>;
  if (error) return <div className="py-4 text-red-400">{error}</div>;
  if (!waypoint) return <div className="py-4 text-black">Waypoint no trobat</div>;

  const icon = createWaypointIcon(waypoint);

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex-1 space-y-3">
            <input
              type="text"
              value={editedNom}
              onChange={(e) => setEditedNom(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
              disabled={saving}
              autoFocus
            />
            <div className="flex gap-2 items-center">
              <select
                value={editedTipus}
                onChange={(e) => setEditedTipus(e.target.value)}
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              >
                {(Object.keys(waypointTypeLabels) as Array<keyof typeof waypointTypeLabels>).map((key) => (
                  <option key={key} value={key}>
                    {waypointTypeLabels[key]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={editedElevacio ?? ""}
                onChange={(e) => setEditedElevacio(e.target.value ? Number(e.target.value) : null)}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
                placeholder="Elevació"
              />
              <span className="text-black/80">m</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1">
              <h1 className="text-3xl font-serif font-bold text-black">
                {waypoint.nom || waypoint.tipus}{waypoint.elevacio ? ` (${waypoint.elevacio}m)` : ""}
              </h1>
              <div className="flex items-center gap-2">
                {waypoint.osm_node && (
                  <a
                    href={`https://www.openstreetmap.org/node/${waypoint.osm_node}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Veure a OpenStreetMap"
                  >
                    <img src="/assets/icons/services/openstreetmap-logo.svg" alt="OSM" className="w-6 h-6" />
                  </a>
                )}
                {waypoint.wikidata && (
                  <a
                    href={`https://www.wikidata.org/wiki/${waypoint.wikidata}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Veure a Wikidata"
                  >
                    <img src="/assets/icons/services/wikidata-logo.svg" alt="Wikidata" className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
            {isAuthenticated && (
              <button
                onClick={handleEditClick}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
              >
                <PencilIcon className="h-6 w-6" />
              </button>
            )}
          </>
        )}
        {isEditing && (
          saving ? (
            <div className="p-2">
              <ArrowPathIcon className="h-6 w-6 text-black/80 animate-spin" />
            </div>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
              >
                <CheckIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </>
          )
        )}
      </div>

      {saveError && <p className="text-red-400">{saveError}</p>}

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-black/80 text-sm">Descripció</label>
            <textarea
              value={editedDescripcio}
              onChange={(e) => setEditedDescripcio(e.target.value)}
              className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg min-h-[80px]"
              disabled={saving}
            />
          </div>
          {isAuthenticated && (
            <div>
              <label className="text-black/80 text-sm">Comentari (privat)</label>
              <textarea
                value={editedComentari}
                onChange={(e) => setEditedComentari(e.target.value)}
                className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg min-h-[80px]"
                disabled={saving}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {waypoint.descripcio && (
            <p className="text-black/90 whitespace-pre-wrap">{waypoint.descripcio}</p>
          )}
          {isAuthenticated && waypoint.comentari && (
            <div className="border-l-2 border-purple-600 pl-3 italic text-black/80">
              {waypoint.comentari}
            </div>
          )}
        </>
      )}

      <div className="h-[450px] rounded-lg overflow-hidden">
        <LeafletMap zoom={13} center={[waypoint.lat, waypoint.lon]}>
          <Marker
            position={[waypoint.lat, waypoint.lon]}
            icon={icon}
          />
        </LeafletMap>
      </div>

      {excursions.length > 0 && (
        <div>
          <h2 className="text-lg font-serif font-semibold text-black mb-2">Excursions</h2>
          <ul className="space-y-1">
            {excursions.map((exc) => (
              <li key={exc.id}>
                <Link
                  to={`/excursions/${exc.slug}`}
                  className="text-purple-600 hover:underline"
                >
                  {exc.titol}
                </Link>
                {exc.privat === 1 && <span className="ml-2 text-purple-600 text-sm">(privat)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
