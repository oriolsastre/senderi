import { useEffect, useState, useCallback } from "react";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

interface Photo {
  filename: string;
  aspectRatio?: number;
}

interface PhotoGalleryProps {
  dataInici: string;
  fotoPassword?: string;
  fotoPrivat?: boolean;
  isAuthenticated: boolean;
  onSaveFotoPassword?: (password: string) => Promise<void>;
}

export default function PhotoGallery({ dataInici, fotoPassword, fotoPrivat, isAuthenticated, onSaveFotoPassword }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editedPassword, setEditedPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [codiInput, setCodiInput] = useState("");
  const [loadingCodi, setLoadingCodi] = useState(false);

  const fetchFotos = useCallback((codi?: string) => {
    const folder = dataInici.replace(/-/g, "");
    const url = codi ? `/api/fotos/${folder}?codi=${encodeURIComponent(codi)}` : `/api/fotos/${folder}`;
    setLoading(true);
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          setPhotos([]);
          return;
        }
        const photoList = await res.json();
        setPhotos(photoList);
        
        photoList.forEach((photo: Photo) => {
          const img = new Image();
          img.onload = () => {
            setPhotos((prev) =>
              prev === null
                ? prev
                : prev.map((p) =>
                    p.filename === photo.filename
                      ? { ...p, aspectRatio: img.naturalWidth / img.naturalHeight }
                      : p
                  )
            );
          };
          img.src = `/fotos/${folder}/${photo.filename}`;
        });
      })
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [dataInici]);

  useEffect(() => {
    fetchFotos();
  }, [fetchFotos]);

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

  if (loading || photos.length === 0) {
    if (!fotoPrivat) {
      return null;
    }
    return (
      <div className="py-4">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-lg font-serif font-semibold text-black">Fotos</h2>
          {isAuthenticated && (
            <button
              onClick={() => {
                setEditedPassword(fotoPassword || "");
                setIsEditingPassword(true);
              }}
              className="p-2 text-black/80 hover:text-black cursor-pointer"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {isEditingPassword ? (
          <div className="flex items-center gap-4 mb-3">
            <input
              type="text"
              value={editedPassword}
              onChange={(e) => setEditedPassword(e.target.value)}
              className="px-3 py-1 bg-white/90 text-gray-900 rounded-lg"
              disabled={savingPassword}
              autoFocus
            />
            {savingPassword ? (
              <div className="p-2">
                <div className="h-5 w-5 border-2 border-black/80 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <button
                  onClick={async () => {
                    if (onSaveFotoPassword) {
                      setSavingPassword(true);
                      await onSaveFotoPassword(editedPassword);
                      setSavingPassword(false);
                    }
                    setIsEditingPassword(false);
                  }}
                  className="p-2 text-black/80 hover:text-black cursor-pointer"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsEditingPassword(false)}
                  className="p-2 text-black/80 hover:text-black cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        ) : isAuthenticated && fotoPassword ? (
          <p className="text-sm text-gray-500 mb-3">CODI: {fotoPassword}</p>
        ) : !isAuthenticated && fotoPrivat ? (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">Tens un codi? Usa'l:</span>
            <input
              type="text"
              value={codiInput}
              onChange={(e) => setCodiInput(e.target.value)}
              placeholder="Codi"
              className="px-3 py-1 bg-white/90 text-gray-900 rounded-lg"
              disabled={loadingCodi}
            />
            <button
              onClick={async () => {
                setLoadingCodi(true);
                await fetchFotos(codiInput);
                setLoadingCodi(false);
              }}
              disabled={loadingCodi || !codiInput}
              className="p-2 text-black/80 hover:text-black cursor-pointer disabled:opacity-50"
            >
              {loadingCodi ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const folder = dataInici.replace(/-/g, "");
  
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
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-lg font-serif font-semibold text-black">Fotos</h2>
        {isAuthenticated && (
          <button
            onClick={() => {
              setEditedPassword(fotoPassword || "");
              setIsEditingPassword(true);
            }}
            className="p-2 text-black/80 hover:text-black cursor-pointer"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {isEditingPassword ? (
        <div className="flex items-center gap-4 mb-3">
          <input
            type="text"
            value={editedPassword}
            onChange={(e) => setEditedPassword(e.target.value)}
            className="px-3 py-1 bg-white/90 text-gray-900 rounded-lg"
            disabled={savingPassword}
            autoFocus
          />
          {savingPassword ? (
            <div className="p-2">
              <div className="h-5 w-5 border-2 border-black/80 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <button
                onClick={async () => {
                  if (onSaveFotoPassword) {
                    setSavingPassword(true);
                    await onSaveFotoPassword(editedPassword);
                    setSavingPassword(false);
                  }
                  setIsEditingPassword(false);
                }}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsEditingPassword(false)}
                className="p-2 text-black/80 hover:text-black cursor-pointer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ) : isAuthenticated && fotoPassword ? (
        <p className="text-sm text-gray-500 mb-3">CODI: {fotoPassword}</p>
      ) : !isAuthenticated && fotoPrivat ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-gray-500">Tens un codi? Usa'l:</span>
          <input
            type="text"
            value={codiInput}
            onChange={(e) => setCodiInput(e.target.value)}
            placeholder="Codi"
            className="px-3 py-1 bg-white/90 text-gray-900 rounded-lg"
            disabled={loadingCodi}
          />
          <button
            onClick={async () => {
              setLoadingCodi(true);
              await fetchFotos(codiInput);
              setLoadingCodi(false);
            }}
            disabled={loadingCodi || !codiInput}
            className="p-2 text-black/80 hover:text-black cursor-pointer disabled:opacity-50"
          >
              {loadingCodi ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => {
          const aspect = photo.aspectRatio || 1;
          const isLandscape = aspect > 1;
          return (
            <button
              key={photo.filename}
              onClick={() => openLightbox(index)}
              className={`relative rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 hover:shadow-lg shadow-purple-500/50 cursor-pointer ${
                isLandscape ? "h-32" : "w-32"
              }`}
              style={isLandscape ? { width: `${aspect * 8}rem` } : {}}
            >
              <img
                src={`/fotos/${folder}/${photo.filename}`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
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
            className="absolute left-4 text-white/80 hover:text-white p-2 cursor-pointer"
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>
          
          <img
            src={`/fotos/${folder}/${photos[lightboxIndex].filename}`}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <button
            onClick={showNext}
            className="absolute right-4 text-white/80 hover:text-white p-2 cursor-pointer"
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}