import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PencilIcon, CheckIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { getExcursio, updateExcursio } from "../api/excursio";
import { Excursio } from "../types/excursio";
import Map from "../components/Map";
import INaturalist from "../components/INaturalist";

interface ExcursioProps {
  isAuthenticated: boolean;
}

export default function Excursio({ isAuthenticated }: ExcursioProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [excursio, setExcursio] = useState<Excursio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedData, setEditedData] = useState("");
  const [editedDistancia, setEditedDistancia] = useState(0);
  const [editedDesnivellPos, setEditedDesnivellPos] = useState(0);
  const [editedDesnivellNeg, setEditedDesnivellNeg] = useState(0);
  const [editedOsm, setEditedOsm] = useState<number | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getExcursio(slug)
      .then(setExcursio)
      .catch(() => setError("Excursio no trobada"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEditClick = () => {
    if (!excursio) return;
    setEditedTitle(excursio.titol);
    setEditedData(excursio.data);
    setEditedDistancia(excursio.distancia);
    setEditedDesnivellPos(excursio.desnivell_pos);
    setEditedDesnivellNeg(excursio.desnivell_neg);
    setEditedOsm(excursio.osm);
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle("");
    setEditedData("");
    setEditedDistancia(0);
    setEditedDesnivellPos(0);
    setEditedDesnivellNeg(0);
    setEditedOsm(null);
    setSaveError(null);
  };

  const handleConfirm = async () => {
    if (!excursio?.id || !editedTitle.trim()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updatedExcursio = await updateExcursio(excursio.id, {
        titol: editedTitle.trim(),
        data: editedData,
        distancia: editedDistancia,
        desnivell_pos: editedDesnivellPos,
        desnivell_neg: editedDesnivellNeg,
        osm: editedOsm,
      });
      setExcursio(updatedExcursio);
      setIsEditing(false);
      if (updatedExcursio.slug !== slug) {
        navigate(`/excursions/${updatedExcursio.slug}`);
      }
    } catch {
      setSaveError("Error en desar");
    } finally {
      setSaving(false);
    }
  };

  const handleEditDescriptionClick = () => {
    setEditedDescription(excursio?.descripcio || "");
    setIsEditingDescription(true);
    setSaveError(null);
  };

  const handleCancelDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
    setSaveError(null);
  };

  const handleConfirmDescription = async () => {
    if (!excursio?.id) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateExcursio(excursio.id, { descripcio: editedDescription });
      setExcursio({ ...excursio, descripcio: editedDescription });
      setIsEditingDescription(false);
    } catch {
      setSaveError("Error en desar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-4 text-white">Loading...</div>;
  if (error) return <div className="py-4 text-red-400">{error}</div>;
  if (!excursio) return <div className="py-4 text-white">Excursio no trobada</div>;

  const distanciaKm = (excursio.distancia / 1000).toFixed(1);

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 min-w-48 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
                autoFocus
              />
              <span className="text-white/80">{"("}</span>
              <input
                type="date"
                value={editedData}
                onChange={(e) => setEditedData(e.target.value)}
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-white/80">{")"}</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="number"
                value={editedDistancia}
                onChange={(e) => setEditedDistancia(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-white/80">m</span>
              <input
                type="number"
                value={editedDesnivellPos}
                onChange={(e) => setEditedDesnivellPos(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-white/80">m</span>
              <input
                type="number"
                value={editedDesnivellNeg}
                onChange={(e) => setEditedDesnivellNeg(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-white/80">m</span>
              <span className="text-white/80">OSM Trace:</span>
              <input
                type="number"
                value={editedOsm ?? ""}
                onChange={(e) => setEditedOsm(e.target.value ? Number(e.target.value) : null)}
                className="w-32 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
                placeholder="ID"
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white flex-1">{excursio.titol} ({excursio.data})</h1>
            {isAuthenticated && (
              <button
                onClick={handleEditClick}
                className="p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <PencilIcon className="h-6 w-6" />
              </button>
            )}
          </>
        )}
        {isEditing && (
          saving ? (
            <div className="p-2">
              <ArrowPathIcon className="h-6 w-6 text-white/80 animate-spin" />
            </div>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                className="p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <CheckIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </>
          )
        )}
      </div>

      {saveError && <p className="text-red-400">{saveError}</p>}

      <p className="text-xl text-white/80">
        {distanciaKm} km <span className="text-white/60">+{excursio.desnivell_pos}m/-{excursio.desnivell_neg}m</span>
      </p>

      <Map osmId={excursio.osm ?? null} />

      <div>
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-lg font-semibold text-white">Descripció</h2>
          {isAuthenticated && (
            <button
              onClick={handleEditDescriptionClick}
              className="p-2 text-white/80 hover:text-white cursor-pointer"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {isEditingDescription ? (
          <div className="flex items-start gap-4">
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/90 text-gray-900 rounded-lg min-h-[100px]"
              disabled={saving}
              autoFocus
            />
            {saving ? (
              <div className="p-2">
                <ArrowPathIcon className="h-6 w-6 text-white/80 animate-spin" />
              </div>
            ) : (
              <>
                <button
                  onClick={handleConfirmDescription}
                  className="p-2 text-white/80 hover:text-white cursor-pointer"
                >
                  <CheckIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={handleCancelDescription}
                  className="p-2 text-white/80 hover:text-white cursor-pointer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-white/90">{excursio.descripcio || "Sense descripció"}</p>
        )}
      </div>

      <INaturalist date={excursio.data} />
    </div>
  );
}
