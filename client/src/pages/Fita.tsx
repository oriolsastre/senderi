import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PencilIcon } from "@heroicons/react/24/solid";
import { getWaypoint, updateWaypoint, getExcursionsByWaypoint } from "../api/waypoint";
import type { WaypointExcursio } from "../api/waypoint";
import type { Waypoint } from "../types/waypoint";
import { createWaypointIcon } from "../utils/waypointMarkers";
import LeafletMap from "../components/LeafletMap";
import { Marker } from "react-leaflet";
import { UpdateWaypointForm } from "../components/UpdateWaypointForm";

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
        setWaypoint(wp);
        setExcursions(excs);
      })
      .catch(() => setError("Waypoint no trobat"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (waypointId: number, data: any) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateWaypoint(waypointId, data);
      setWaypoint(updated);
      setIsEditing(false);
    } catch {
      setSaveError("Error en desar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  if (loading) return <div className="py-4 text-black">Loading...</div>;
  if (error) return <div className="py-4 text-red-400">{error}</div>;
  if (!waypoint) return <div className="py-4 text-black">Waypoint no trobat</div>;

  const icon = createWaypointIcon(waypoint);

  return (
    <div className="py-4 space-y-6">
      {isEditing ? (
        <div className="w-full">
          <UpdateWaypointForm
             waypoint={waypoint}
             saving={saving}
             onSave={handleSave}
             onCancel={handleCancel}
           />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
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
                onClick={() => setIsEditing(true)}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
              >
                <PencilIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {saveError && <p className="text-red-400">{saveError}</p>}

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
