import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PencilIcon, CheckIcon, XMarkIcon, ArrowPathIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { getExcursio, updateExcursio, getExcursioVeins, type Veins } from "../api/excursio";
import type { Excursio } from "../types/excursio";
import Waypoints from "../components/Waypoints";

const Map = lazy(() => import("../components/Map"));
const INaturalist = lazy(() => import("../components/INaturalist"));
const PhotoGallery = lazy(() => import("../components/PhotoGallery"));
const CommonsPhotos = lazy(() => import("../components/CommonsPhotos"));

interface ExcursioProps {
  isAuthenticated: boolean;
}

interface EditForm {
  titol: string;
  dataInici: string;
  dataFinal: string;
  distancia: number;
  desnivell_pos: number;
  desnivell_neg: number;
  osm: number | null;
}

const defaultEditForm: EditForm = {
  titol: "",
  dataInici: "",
  dataFinal: "",
  distancia: 0,
  desnivell_pos: 0,
  desnivell_neg: 0,
  osm: null,
};

function SaveButtons({ saving, onConfirm, onCancel }: { saving: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (saving) {
    return (
      <div className="p-2">
        <ArrowPathIcon className="h-6 w-6 text-black/80 animate-spin" />
      </div>
    );
  }
  return (
    <>
      <button onClick={onConfirm} className="p-2 text-black/80 hover:text-black cursor-pointer">
        <CheckIcon className="h-6 w-6" />
      </button>
      <button onClick={onCancel} className="p-2 text-black/80 hover:text-black cursor-pointer">
        <XMarkIcon className="h-6 w-6" />
      </button>
    </>
  );
}

export default function Excursio({ isAuthenticated }: ExcursioProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [excursio, setExcursio] = useState<Excursio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [veins, setVeins] = useState<Veins | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(defaultEditForm);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getExcursio(slug, true)
      .then(setExcursio)
      .catch(() => setError("Excursio no trobada"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!excursio?.id) return;
    getExcursioVeins(excursio.id)
      .then(setVeins)
      .catch(() => setVeins(null));
  }, [excursio?.id]);

  const handleEditClick = () => {
    if (!excursio) return;
    setEditForm({
      titol: excursio.titol,
      dataInici: excursio.data_inici,
      dataFinal: excursio.data_final,
      distancia: excursio.distancia,
      desnivell_pos: excursio.desnivell_pos,
      desnivell_neg: excursio.desnivell_neg,
      osm: excursio.osm,
    });
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(defaultEditForm);
  };

  const handleConfirm = async () => {
    if (!excursio?.id || !editForm.titol.trim()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updatedExcursio = await updateExcursio(excursio.id, {
        titol: editForm.titol.trim(),
        data_inici: editForm.dataInici,
        data_final: editForm.dataFinal,
        distancia: editForm.distancia,
        desnivell_pos: editForm.desnivell_pos,
        desnivell_neg: editForm.desnivell_neg,
        osm: editForm.osm,
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

  const handleSaveFotoPassword = useCallback(async (password: string) => {
    if (!excursio?.id) return;
    await updateExcursio(excursio.id, { foto_password: password });
    setExcursio({ ...excursio, foto_password: password });
  }, [excursio]);

  if (loading) return <div className="py-4 text-black">Loading...</div>;
  if (error) return <div className="py-4 text-red-400">{error}</div>;
  if (!excursio) return <div className="py-4 text-black">Excursio no trobada</div>;

  const distanciaKm = (excursio.distancia / 1000).toFixed(1);

  return (
    <div className="py-4 space-y-6">
      {veins && (veins.anterior || veins.seguent) && (
        <div className="flex justify-between text-sm font-serif text-black/70">
          {veins.anterior ? (
            <Link to={`/excursions/${veins.anterior.slug}`} className="max-w-[50%] hover:text-purple-600 flex gap-1 items-center">
              <ArrowLeftIcon className="h-4 w-4 shrink-0" />
              <span>{veins.anterior.data_inici}</span>
              <span className="hidden sm:block truncate">{veins.anterior.titol}</span>
            </Link>
          ) : <span className="max-w-[50%]" />}
          {veins.seguent ? (
            <Link to={`/excursions/${veins.seguent.slug}`} className="max-w-[50%] hover:text-purple-600 flex gap-1 justify-end text-right items-center">
              <span className="hidden sm:block truncate">{veins.seguent.titol}</span>
              <span>{veins.seguent.data_inici}</span>
              <ArrowRightIcon className="h-4 w-4 shrink-0" />
            </Link>
          ) : <span className="max-w-[50%]" />}
        </div>
      )}

      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={editForm.titol}
                onChange={(e) => setEditForm((prev) => ({ ...prev, titol: e.target.value }))}
                className="flex-1 min-w-48 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
                autoFocus
              />
              <span className="text-black/80">{"("}</span>
              <input
                type="date"
                value={editForm.dataInici}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, dataInici: e.target.value, dataFinal: e.target.value }));
                }}
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-black/80">-</span>
              <input
                type="date"
                value={editForm.dataFinal}
                onChange={(e) => setEditForm((prev) => ({ ...prev, dataFinal: e.target.value }))}
                className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-black/80">{")"}</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="number"
                value={editForm.distancia}
                onChange={(e) => setEditForm((prev) => ({ ...prev, distancia: Number(e.target.value) }))}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-black/80">m</span>
              <input
                type="number"
                value={editForm.desnivell_pos}
                onChange={(e) => setEditForm((prev) => ({ ...prev, desnivell_pos: Number(e.target.value) }))}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-black/80">m</span>
              <input
                type="number"
                value={editForm.desnivell_neg}
                onChange={(e) => setEditForm((prev) => ({ ...prev, desnivell_neg: Number(e.target.value) }))}
                className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
              />
              <span className="text-black/80">m</span>
              <span className="text-black/80">OSM Trace:</span>
              <input
                type="number"
                value={editForm.osm ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, osm: e.target.value ? Number(e.target.value) : null }))}
                className="w-32 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
                disabled={saving}
                placeholder="ID"
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-serif font-bold text-black flex-1">{excursio.titol} ({excursio.data_inici}{excursio.data_final !== excursio.data_inici && ` - ${excursio.data_final}`})</h1>
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
        {isEditing && <SaveButtons saving={saving} onConfirm={handleConfirm} onCancel={handleCancel} />}
      </div>

      {saveError && <p className="text-red-400">{saveError}</p>}

      <p className="text-xl text-black/80 -mt-4">
        {distanciaKm} km <span className="text-black/60">+{excursio.desnivell_pos}m/-{excursio.desnivell_neg}m</span>
      </p>

      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg">Carregant mapa...</div>}>
        <Map id={excursio.id!} osmId={excursio.osm ?? null} slug={excursio.slug} isAuthenticated={isAuthenticated} waypoints={excursio.fites} />
      </Suspense>

      <div>
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-lg font-serif font-semibold text-black">Descripció</h2>
          {isAuthenticated && (
            <button
              onClick={handleEditDescriptionClick}
              className="p-2 text-black/80 hover:text-black cursor-pointer"
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
            <SaveButtons saving={saving} onConfirm={handleConfirmDescription} onCancel={handleCancelDescription} />
          </div>
        ) : (
          <p className="text-black/90 whitespace-pre-wrap">{excursio.descripcio || "Sense descripció"}</p>
        )}
      </div>

      {excursio.fites && excursio.fites.length > 0 && (
        <Waypoints key={excursio.id} excursio={excursio} isAuthenticated={isAuthenticated} fites={excursio.fites} />
      )}

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg">Carregant fotos...</div>}>
        <PhotoGallery
          dataInici={excursio.data_inici}
          fotoPassword={excursio.foto_password}
          fotoPrivat={excursio.foto_privat}
          isAuthenticated={isAuthenticated}
          onSaveFotoPassword={handleSaveFotoPassword}
        />
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg">Carregant fotos de Commons...</div>}>
        <CommonsPhotos
          dataInici={excursio.data_inici}
          dataFinal={excursio.data_final}
          isAuthenticated={isAuthenticated}
        />
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg">Carregant observacions...</div>}>
        <INaturalist dateInici={excursio.data_inici} dateFinal={excursio.data_final} isAuthenticated={isAuthenticated} />
      </Suspense>
    </div>
  );
}
