import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExcursions } from "../api/excursio";
import { Excursio } from "../types/excursio";

export default function List() {
  const [excursions, setExcursions] = useState<Excursio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExcursions()
      .then(setExcursions)
      .catch(() => setError("Error loading excursions"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-4 text-white">Loading...</div>;
  }

  if (error) {
    return <div className="py-4 text-red-400">{error}</div>;
  }

  if (excursions.length === 0) {
    return <div className="py-4 text-white/80">No excursions yet</div>;
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Excursions</h1>
      <ul className="space-y-2">
        {excursions.map((excursion) => (
          <li key={excursion.id}>
            <Link
              to={`/${excursion.slug}`}
              className="text-white/90 hover:text-white hover:underline"
            >
              {excursion.titol}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
