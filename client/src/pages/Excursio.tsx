import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExcursio } from "../api/excursio";
import { Excursio } from "../types/excursio";
import Map from "../components/Map";

export default function Excursio() {
  const { slug } = useParams<{ slug: string }>();
  const [excursio, setExcursio] = useState<Excursio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getExcursio(slug)
      .then(setExcursio)
      .catch(() => setError("Excursio no trobada"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!excursio) return <div className="p-4">Excursio no trobada</div>;

  const distanciaKm = (excursio.distancia / 1000).toFixed(1);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{excursio.titol}</h1>
        <p className="text-xl text-gray-600">{distanciaKm} km</p>
      </div>

      <Map osmId={excursio.osm ?? null} />

      {excursio.descripcio && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Descripció</h2>
          <p className="text-gray-700">{excursio.descripcio}</p>
        </div>
      )}
    </div>
  );
}
