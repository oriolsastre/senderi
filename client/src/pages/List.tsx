import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/solid";
import { getExcursions } from "../api/excursio";
import { Excursio } from "../types/excursio";

interface ListProps {
  isAuthenticated: boolean;
}

export default function List({ isAuthenticated }: ListProps) {
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
    return <div className="py-4 text-black">Loading...</div>;
  }

  if (error) {
    return <div className="py-4 text-red-400">{error}</div>;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-black">Excursions</h1>
        {isAuthenticated && (
          <Link
            to="/nou"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-black rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5" />
            Afegeix excursió
          </Link>
        )}
      </div>
      {excursions.length === 0 ? (
        <p className="text-black/80">No excursions yet</p>
      ) : (
        <ul className="space-y-2">
          {excursions.map((excursion) => (
            <li key={excursion.id}>
              <Link
                to={`/excursions/${excursion.slug}`}
                className="text-black/90 hover:text-black hover:underline"
              >
                {excursion.titol}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
