import { useEffect, useState, useCallback } from "react";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface CommonsPhotosProps {
  dataInici?: string;
  dataFinal?: string;
  wikidata?: string;
}

interface CommonsPhoto {
  file: string;
  label: string | null;
  date: string | null;
  url: string | null;
  imageUrl: string | null;
  thumb: string | null;
  aspectRatio?: number;
}

export default function CommonsPhotos({ dataInici, dataFinal, wikidata }: CommonsPhotosProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CommonsPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (dataInici) params.set("d1", dataInici);
    if (dataFinal) params.set("d2", dataFinal);
    if (wikidata) params.set("wikidata", wikidata);

    if (params.toString() === "") {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/commons/fotos?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const photosWithRatio = data.map((photo: any) => ({ ...photo, aspectRatio: undefined }));
      setPhotos(photosWithRatio);

      // Preload images to calculate aspect ratios
      photosWithRatio.forEach((photo: CommonsPhoto) => {
        if (!photo.thumb) return;
        const img = new Image();
        img.onload = () => {
          setPhotos((prev) =>
            prev.map((p) =>
              p.file === photo.file
                ? { ...p, aspectRatio: img.naturalWidth / img.naturalHeight }
                : p
            )
          );
        };
        img.src = photo.thumb;
      });
    } catch (e) {
      console.log(e);
      setError("Error carregant fotos de Commons");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [dataInici, dataFinal, wikidata]);

  useEffect(() => {
    if (dataInici || dataFinal || wikidata) {
      fetchPhotos();
    } else {
      setPhotos([]);
      setLoading(false);
    }
  }, [fetchPhotos]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev === null || prev === 0 ? photos.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev === null || prev === photos.length - 1 ? 0 : prev + 1));
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, photos.length]);

  if (loading) {
    return (
      <div className="py-4">
        <p className="text-black/80">Carregant fotos de Commons...</p>
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

  if (!photos || photos.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === null || prev === 0 ? photos.length - 1 : prev - 1));
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === null || prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="py-4">
      <h2 className="text-lg font-serif font-semibold text-black mb-3 flex items-center gap-2">
        Fotos (Wikimedia Commons)
        <a
          href="https://wikidata.org"
          target="_blank"
          rel="noopener noreferrer"
          title="Impulsat per la Wikidata"
          className="hover:cursor-pointer flex-shrink-0"
        >
          <img src="/assets/icons/services/wikidata-powered-light.svg" alt="Wikidata" className="h-4 w-auto" />
        </a>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 items-end">
        {photos.map((photo, index) => (
          <div
            key={photo.file || index}
            className="flex flex-col"
          >
            <button
              onClick={() => openLightbox(index)}
              className="block w-full rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 hover:shadow-lg shadow-purple-500/50 cursor-pointer"
              style={{ aspectRatio: photo.aspectRatio || 1 }}
            >
              {photo.thumb ? (
                <img
                  src={photo.thumb}
                  alt={photo.label || "Commons photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs rounded-lg bg-gray-100">
                  No image
                </div>
              )}
            </button>
            {photo.label && (
              <div className="mt-1 flex items-center gap-1 min-w-0">
                <p className="text-xs text-black/70 truncate">
                  {photo.label}
                </p>
                <a
                  href={photo.file || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Veure a la Wikimedia Commons"
                  className="hover:cursor-pointer flex-shrink-0"
                >
                  <img src="/assets/icons/services/commons-logo.svg" alt="Commons" className="h-4 w-auto" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 cursor-pointer"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          <button
            onClick={showPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 cursor-pointer"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>

          <div className="flex-1 flex items-center justify-center max-h-[80vh] mb-4">
            <img
              src={photos[lightboxIndex].imageUrl || photos[lightboxIndex].thumb || ""}
              alt={photos[lightboxIndex].label || ""}
              className="max-h-[80vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="flex-shrink-0 pb-12 text-center">
            {photos[lightboxIndex]?.label && (
              <p className="text-white/80 text-sm px-4 pb-2 max-w-[90vw] flex items-center justify-center gap-2">
                {photos[lightboxIndex].label}
                <a
                  href={photos[lightboxIndex]?.file || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Veure a la Wikimedia Commons"
                  className="hover:cursor-pointer flex-shrink-0 inline-flex"
                >
                  <img src="/assets/icons/services/commons-logo.svg" alt="Commons" className="h-5 w-auto" />
                </a>
              </p>
            )}
            <p className="text-white/80 text-sm">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>

          <button
            onClick={showNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 cursor-pointer"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
}
