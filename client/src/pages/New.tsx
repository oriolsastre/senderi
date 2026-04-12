import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { createExcursio } from "../api/excursio";

interface NewProps {
  isAuthenticated: boolean;
}

export default function New({ isAuthenticated }: NewProps) {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  const [titol, setTitol] = useState("");
  const [dataInici, setDataInici] = useState(today);
  const [dataFinal, setDataFinal] = useState(today);
  const [distancia, setDistancia] = useState(0);
  const [desnivellPos, setDesnivellPos] = useState(0);
  const [desnivellNeg, setDesnivellNeg] = useState(0);
  const [osm, setOsm] = useState<number | null>(null);
  const [descripcio, setDescripcio] = useState("");
  const [privat, setPrivat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titol.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const excursion = await createExcursio({
        titol: titol.trim(),
        data_inici: dataInici,
        data_final: dataFinal || dataInici,
        distancia: distancia,
        desnivell_pos: desnivellPos,
        desnivell_neg: desnivellNeg,
        osm: osm,
        descripcio: descripcio || null,
        privat: privat ? 1 : 0,
      });
      navigate(`/excursions/${excursion.slug}`);
    } catch {
      setError("Error en crear l'excursió");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-black mb-6">Nova Excursió</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-black/80 mb-1">Titol *</label>
          <input
            type="text"
            value={titol}
            onChange={(e) => setTitol(e.target.value)}
            className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-black/80 mb-1">Data inici</label>
            <input
              type="date"
              value={dataInici}
              onChange={(e) => setDataInici(e.target.value)}
              className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-black/80 mb-1">Data final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-black/80 mb-1">Distancia (m)</label>
            <input
              type="number"
              value={distancia}
              onChange={(e) => setDistancia(Number(e.target.value))}
              className="w-32 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-black/80 mb-1">Desnivell + (m)</label>
            <input
              type="number"
              value={desnivellPos}
              onChange={(e) => setDesnivellPos(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-black/80 mb-1">Desnivell - (m)</label>
            <input
              type="number"
              value={desnivellNeg}
              onChange={(e) => setDesnivellNeg(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-black/80 mb-1">OSM Trace ID</label>
          <input
            type="number"
            value={osm ?? ""}
            onChange={(e) => setOsm(e.target.value ? Number(e.target.value) : null)}
            className="w-32 px-3 py-2 bg-white/90 text-gray-900 rounded-lg"
            placeholder="ID"
          />
        </div>

        <div>
          <label className="block text-black/80 mb-1">Descripció</label>
          <textarea
            value={descripcio}
            onChange={(e) => setDescripcio(e.target.value)}
            className="w-full px-3 py-2 bg-white/90 text-gray-900 rounded-lg min-h-[100px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="privat"
            checked={privat}
            onChange={(e) => setPrivat(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="privat" className="text-black/80">Privada</label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving || !titol.trim()}
            className="px-6 py-2 bg-green-600 text-black rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              "Crear"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-white/20 text-black rounded-lg hover:bg-white/30 cursor-pointer"
          >
            Cancel·lar
          </button>
        </div>
      </form>
    </div>
  );
}
