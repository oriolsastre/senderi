import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import "leaflet/dist/leaflet.css";
import "leaflet-gpx";
import "proj4leaflet";
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

// @ts-ignore - proj4leaflet adds L.Proj.CRS
const crsICGC = new L.Proj.CRS(
  "EPSG:25831",
  "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  {
    resolutions: [1100, 550, 275, 100, 50, 25, 10, 5, 2, 1, 0.5, 0.25],
    origin: [0, 0],
  }
);

interface MapProps {
  osmId: number | null;
}

function GPXLoader({ osmId, mapProvider }: { osmId: number; mapProvider: "osm" | "icgc" }) {
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
  }, [osmId, map, mapProvider]);

  return null;
}

export default function Map({ osmId }: MapProps) {
  const [mapProvider, setMapProvider] = useState<"osm" | "icgc">("osm");

  if (!osmId) {
    return null;
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden relative">
      <div className="absolute top-2 right-2 z-[1000] flex gap-1">
        <button
          onClick={() => setMapProvider("osm")}
          className={`px-2 py-1 text-xs rounded ${
            mapProvider === "osm"
              ? "bg-green-600 text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          OSM
        </button>
        <button
          onClick={() => setMapProvider("icgc")}
          className={`px-2 py-1 text-xs rounded ${
            mapProvider === "icgc"
              ? "bg-green-600 text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          ICGC
        </button>
      </div>
      <MapContainer
        className="h-full w-full"
        crs={mapProvider === "icgc" ? crsICGC : L.CRS.EPSG3857}
        center={mapProvider === "icgc" ? [4182545, 465195] : [41.3874, 2.1686]}
        zoom={mapProvider === "icgc" ? 6 : 13}
      >
        {mapProvider === "osm" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <WMSTileLayer
            url="https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?"
            layers="topo"
            format="image/jpeg"
            attribution="Institut Cartogràfic i Geològic de Catalunya"
          />
        )}
        <GPXLoader osmId={osmId} mapProvider={mapProvider} />
      </MapContainer>
    </div>
  );
}
