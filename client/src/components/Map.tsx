import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-gpx";

interface MapProps {
  osmId: number | null;
}

function GPXLoader({ osmId }: { osmId: number }) {
  const map = useMap();

  useEffect(() => {
    const gpxUrl = `/api/excursions/${osmId}/gpx`;

    // @ts-ignore - leaflet-gpx types not perfect
    const gpx = new L.GPX(gpxUrl, {
      async: true,
      marker_options: {
        startIconUrl: undefined,
        endIconUrl: undefined,
        shadowUrl: undefined,
      },
    })
      .on("loaded", (e: any) => {
        map.fitBounds(e.target.getBounds());
      })
      .on("error", (e: any) => {
        console.error("GPX load error:", e);
      })
      .addTo(map);

    return () => {
      map.removeLayer(gpx);
    };
  }, [osmId, map]);

  return null;
}

export default function Map({ osmId }: MapProps) {
  if (!osmId) {
    return null;
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden">
      <MapContainer
        className="h-full w-full"
        center={[41.3874, 2.1686]}
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GPXLoader osmId={osmId} />
      </MapContainer>
    </div>
  );
}
