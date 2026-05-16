import { CloudArrowUpIcon } from "@heroicons/react/24/solid";
import type { GPXStats } from "./StatsLoader";

interface GPXStatsProps {
  gpxStats: GPXStats | null;
  isSaving: boolean;
  onSaveStats: () => void;
}

export default function GpxStatsImport({ gpxStats, isSaving, onSaveStats }: GPXStatsProps) {
  if (!gpxStats) return null;

  const distanceKm = (gpxStats.distance / 1000).toFixed(1);
  const elevationGain = Math.round(gpxStats.elevation_gain);
  const elevationLoss = Math.round(gpxStats.elevation_loss);

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 px-3 py-1 rounded-md text-sm flex items-center gap-2">
      <span>{distanceKm} km</span>
      <span className="mx-2 text-black/50">|</span>
      <span>+{elevationGain}m/-{elevationLoss}m</span>
      <button
        onClick={onSaveStats}
        disabled={isSaving}
        className={`p-1 rounded hover:bg-gray-200 ${isSaving ? "text-gray-400" : "text-green-600"}`}
        title="Desa les estadístiques"
      >
        <CloudArrowUpIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
