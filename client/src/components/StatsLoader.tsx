import React, { useEffect } from "react";

interface StatsLoaderProps {
  osmId: number;
  onStatsLoaded: (stats: GPXStats) => void;
}

interface GPXStats {
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  elevation_max: number;
  elevation_min: number;
}

export function StatsLoader({ osmId, onStatsLoaded }: StatsLoaderProps) {
  useEffect(() => {
    fetch(`/api/excursions/${osmId}/gpx/stats`)
      .then(res => res.json())
      .then(onStatsLoaded)
      .catch(err => console.error("Failed to load stats:", err));
  }, [osmId]);

  return null;
}

export type { GPXStats };
