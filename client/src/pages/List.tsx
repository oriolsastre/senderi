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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {excursions.map((excursion) => {
            const distanceKm = excursion.distancia ? (excursion.distancia / 1000).toFixed(1) : null;
            const startDate = excursion.data_inici;
            const endDate = excursion.data_final;
            const start = new Date(startDate);
            const end = new Date(endDate);
            const daysDiff = startDate === endDate ? null : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const daysText = daysDiff ? `(${daysDiff} dies)` : null;
            
            return (
              <Link
                key={excursion.id}
                to={`/excursions/${excursion.slug}`}
                className="block p-4 rounded-lg border border-purple-500 hover:shadow-[0_0_8px_rgba(147,51,234,0.5)]"
              >
                <h3 className="text-lg font-serif font-bold text-black mb-1">{excursion.titol}</h3>
                <p className="text-sm text-black/70 font-bold mb-1">{startDate} {daysText}</p>
                <p className="text-sm text-black/70">
                  {distanceKm && `${distanceKm} km`}
                  {distanceKm && excursion.desnivell_pos > 0 && " · "}
                  {excursion.desnivell_pos > 0 && `+${Math.round(excursion.desnivell_pos)}m/-${Math.round(excursion.desnivell_neg)}m`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
