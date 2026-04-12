import { useEffect, useState } from "react";

interface INaturalistProps {
  dateInici: string;
  dateFinal: string;
}

interface INatObservation {
  id?: number;
  speciesGuess?: string;
  taxon?: {
    name?: string;
  };
  photos?: Array<{
    url?: string;
  }>;
}

interface INatResponse {
  totalResults?: number;
  page?: number;
  perPage?: number;
  results?: INatObservation[];
}

export default function INaturalist({ dateInici, dateFinal }: INaturalistProps) {
  const [observations, setObservations] = useState<INatObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObservations = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          d1: dateInici,
          d2: dateFinal,
          perPage: "50",
        });

        const response = await fetch(`/api/inaturalist/observations?${params}`);
        const data: INatResponse = await response.json();

        setObservations(data.results || []);
      } catch {
        setError("Error carregant observacions");
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();
  }, [dateInici, dateFinal]);

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-white/80">Carregant observacions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div className="py-4">
        <h2 className="text-lg font-semibold text-white mb-2">
          Observacions iNaturalist
        </h2>
        <p className="text-white/60">Cap observació per a aquesta data</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold text-white mb-3">
        Observacions iNaturalist ({observations.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {observations.map((obs) => (
          <a
            key={obs.id}
            href={`https://www.inaturalist.org/observations/${obs.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="aspect-square overflow-hidden rounded-lg bg-white/10">
              {obs.photos?.[0]?.url && (
                <img
                  src={obs.photos[0].url?.replace("square.", "medium.")}
                  alt={obs.taxon?.name || obs.speciesGuess || "Observacio"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              )}
            </div>
            <p className="mt-1 text-xs text-white/70 truncate">
              {obs.taxon?.name || obs.speciesGuess || "Sense identificacio"}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
