import { useEffect, useState } from "react";

const capitalizeFirst = (str?: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

interface INaturalistProps {
  dateInici: string;
  dateFinal: string;
}

interface INatObservation {
  id?: number;
  taxon?: {
    name?: string;
    preferred_common_name?: string;
  };
  photos?: Array<{
    url?: string;
  }>;
}

interface INatResponse {
  total_results: number;
  page: number;
  per_page: number;
  results?: INatObservation[];
}

export default function INaturalist({ dateInici, dateFinal }: INaturalistProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedPages, setFetchedPages] = useState<Map<number, INatResponse>>(new Map());
  const [data, setData] = useState<INatResponse | null>(null);

  useEffect(() => {
    const fetchObservations = async () => {
      setLoading(true);
      setError(null);

      // Check if data for the current page is already cached
      if (fetchedPages.has(currentPage)) {
        const cachedData = fetchedPages.get(currentPage)!;
        setData(cachedData);
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          d1: dateInici,
          d2: dateFinal,
          page: currentPage.toString(),
        });

        const response = await fetch(`/api/inaturalist/observations?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: INatResponse = await response.json();

        setData(data); // Set the data state

        // Cache the newly fetched data
        const newFetchedPages = new Map(fetchedPages);
        newFetchedPages.set(currentPage, data);
        setFetchedPages(newFetchedPages);

      } catch (e) {
        setError("Error carregant observacions");
        setData(null); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();
  }, [dateInici, dateFinal, currentPage, fetchedPages]);

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-black/80">Carregant observacions...</p>
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

  if (!data || !data.results || data.results.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-serif font-semibold text-black mb-3">
        Observacions iNaturalist ({data?.total_results || 0})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
        {data?.results?.map((obs) => (
          <a
            key={obs.id}
            href={`https://www.inaturalist.org/observations/${obs.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-200 group-hover:shadow-[0_0_16px_rgba(147,51,234,0.8)] transition-shadow duration-200">
              {obs.photos?.[0]?.url && (
                <img
                  src={obs.photos?.[0]?.url?.replace("square.", "medium.")}
                  alt={capitalizeFirst(obs.taxon?.preferred_common_name) || obs.taxon?.name || "Observacio"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              )}
            </div>
            {obs.taxon?.preferred_common_name ? (
              <p className="mt-1 text-xs text-black/70 truncate">
                {capitalizeFirst(obs.taxon.preferred_common_name)}
              </p>
            ) : null}
            {obs.taxon?.name && (
              <p className="text-xs text-black/60 truncate italic">
                {obs.taxon.name}
              </p>
            )}
          </a>
        ))}
      </div>
      {data && data.total_results && data.per_page && data.total_results > data.per_page && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: Math.ceil((data.total_results || 0) / (data.per_page || 1)) }, (_, i) => {
            const pageNumber = i + 1;
            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                disabled={loading || pageNumber === currentPage}
                className={`px-4 py-2 ${pageNumber === currentPage ? 'bg-purple-800' : 'bg-purple-600 hover:shadow-[0_0_10px_rgba(147,51,234,0.8)] hover:cursor-pointer'} text-white disabled:bg-gray-400 ${i === 0 ? 'rounded-l-md' : ''} ${i === Math.ceil((data.total_results || 0) / (data.per_page || 1)) - 1 ? 'rounded-r-md' : ''}`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

