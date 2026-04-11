import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExcursio } from "../api/excursio";
import { Excursio } from "../types/excursio";

export default function Hike() {
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{excursio.titol}</h1>
      <ul className="space-y-2">
        <li><strong>Data:</strong> {excursio.data}</li>
        <li><strong>Distància:</strong> {excursio.distancia} km</li>
        <li><strong>Desnivell positiu:</strong> {excursio.desnivell_pos} m</li>
        <li><strong>Desnivell negatiu:</strong> {excursio.desnivell_neg} m</li>
        {excursio.descripcio && <li><strong>Descripció:</strong> {excursio.descripcio}</li>}
        {excursio.osm && <li><strong>OSM:</strong> {excursio.osm}</li>}
        {excursio.id !== undefined && <li><strong>ID:</strong> {excursio.id}</li>}
        {excursio.privat !== undefined && <li><strong>Privat:</strong> {excursio.privat ? "Sí" : "No"}</li>}
      </ul>
    </div>
  );
}
