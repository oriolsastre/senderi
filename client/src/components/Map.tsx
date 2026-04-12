import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import "leaflet/dist/leaflet.css";
import "leaflet-gpx";
import { MapPinIcon, FlagIcon } from "@heroicons/react/24/solid";

const createIcon = (icon: typeof MapPinIcon, color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: ReactDOMServer.renderToStaticMarkup(
      React.createElement(icon, { className: "w-6 h-6", style: { color } })
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

const startIcon = createIcon(MapPinIcon, "#22c55e");
const endIcon = createIcon(FlagIcon, "#ef4444");

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
      polyline_options: {
        color: "purple",
        opacity: 0.8,
        weight: 4,
      },
      marker_options: {
        startIconUrl: "",
        endIconUrl: "",
        shadowUrl: "",
        startDivIcon: startIcon,
        endDivIcon: endIcon,
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
