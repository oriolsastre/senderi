import { ReactNode, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "proj4leaflet";

// @ts-ignore - proj4leaflet adds L.Proj.CRS
const crsICGC = new L.Proj.CRS(
  "EPSG:25831",
  "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  {
    resolutions: [1100, 550, 275, 100, 50, 25, 10, 5, 2, 1, 0.5, 0.25],
    origin: [0, 0],
  }
);

interface LeafletMapProps {
  children?: ReactNode;
  showLayerToggle?: boolean;
  className?: string;
  zoom?: number;
}

export default function LeafletMap({ 
  children, 
  showLayerToggle = true, 
  className = "h-[450px] w-full",
  zoom,
}: LeafletMapProps) {
  const [mapProvider, setMapProvider] = useState<"osm" | "icgc">("osm");

  const defaultCenter: [number, number] = mapProvider === "icgc" ? [4182545, 465195] : [41.469197, 2.061967];
  const defaultZoom = mapProvider === "icgc" ? 6 : 13;

  return (
    <div className={`rounded-lg overflow-hidden relative ${className}`}>
      {showLayerToggle && (
        <div className="absolute top-2 right-2 z-[1000] flex gap-1">
          <button
            onClick={() => setMapProvider("osm")}
            className={`px-2 py-1 text-xs rounded ${mapProvider === "osm"
              ? "bg-green-600 text-white"
              : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            OSM
          </button>
          <button
            onClick={() => setMapProvider("icgc")}
            className={`px-2 py-1 text-xs rounded ${mapProvider === "icgc"
              ? "bg-green-600 text-white"
              : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            ICGC
          </button>
        </div>
      )}
      <MapContainer
        className="h-full w-full"
        crs={mapProvider === "icgc" ? crsICGC : L.CRS.EPSG3857}
        center={defaultCenter}
        zoom={zoom || defaultZoom}
        zoomControl={true}
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
        {children}
      </MapContainer>
    </div>
  );
}

export { crsICGC };