import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface GPXLoaderProps {
  osmId: number;
  trackPoints?: { lat: number; lon: number }[];
  onTrackPointClick?: (index: number | null) => void;
}

export function GPXLoader({ osmId, trackPoints, onTrackPointClick }: GPXLoaderProps) {
  const map = useMap();

  useEffect(() => {
    const gpxUrl = `/api/excursions/${osmId}/gpx`;

    // @ts-ignore - leaflet-gpx adds GPX to L
    const gpx = new L.GPX(gpxUrl, {
      async: true,
      polyline_options: {
        color: "purple",
        opacity: 0.8,
        weight: 4,
      },
      markers: {
        startIcon: "/assets/icons/start.svg",
        endIcon: "/assets/icons/finish.svg",
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

  useEffect(() => {
    if (!map || !trackPoints || trackPoints.length === 0 || !onTrackPointClick) {
      return;
    }

    const padding = 0.01;

    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const pt of trackPoints) {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    }

    const handleClick = (e: any) => {
      const clicked = e.latlng;
      if (clicked.lat < minLat - padding || clicked.lat > maxLat + padding ||
        clicked.lon < minLon - padding || clicked.lon > maxLon + padding) {
        onTrackPointClick(null);
        return;
      }

      let closestIdx = 0;
      let closestDist = Infinity;
      const step = Math.max(1, Math.floor(trackPoints.length / 50));

      for (let i = 0; i < trackPoints.length; i += step) {
        const dist = map.distance(clicked, [trackPoints[i].lat, trackPoints[i].lon]);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      const start = Math.max(0, closestIdx - step);
      const end = Math.min(trackPoints.length, closestIdx + step);
      for (let i = start; i < end; i++) {
        const dist = map.distance(clicked, [trackPoints[i].lat, trackPoints[i].lon]);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (closestDist < 100) {
        onTrackPointClick(closestIdx);
      } else {
        onTrackPointClick(null);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, trackPoints, onTrackPointClick]);

  return null;
}