import { haversineDistance } from "./gpxUtils";

export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
}

export interface GPXStats {
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  elevation_max: number;
  elevation_min: number;
}

export interface TimeInfo {
  startDate: string;
  endDate: string;
  duration: string;
}

export function parseGPX(gpxString: string): TrackPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, "application/xml");
  const trkpts = doc.querySelectorAll("trkpt");

  const points: TrackPoint[] = [];
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    const ele = parseFloat(pt.querySelector("ele")?.textContent || "0");
    const time = pt.querySelector("time")?.textContent?.trim() || undefined;
    points.push({ lat, lon, ele, time });
  });

  return points;
}

export function computeGPXStats(points: TrackPoint[]): GPXStats {
  if (points.length < 2) {
    return { distance: 0, elevation_gain: 0, elevation_loss: 0, elevation_max: 0, elevation_min: 0 };
  }

  let totalDistance = 0;
  let smoothedEle = points[0].ele || 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let eleMin = points[0].ele || 0;
  let eleMax = points[0].ele || 0;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (isNaN(p.lat) || isNaN(p.lon)) continue;

    totalDistance += haversineDistance(points[i - 1].lat, points[i - 1].lon, p.lat, p.lon);

    const prevSmoothedEle = smoothedEle;
    if (!isNaN(p.ele)) {
      smoothedEle = 0.25 * p.ele + 0.75 * smoothedEle;
      const diff = smoothedEle - prevSmoothedEle;
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }

    if (!isNaN(p.ele)) {
      if (p.ele < eleMin) eleMin = p.ele;
      if (p.ele > eleMax) eleMax = p.ele;
    }
  }

  return {
    distance: Math.round(totalDistance),
    elevation_gain: Math.round(elevationGain),
    elevation_loss: Math.round(elevationLoss),
    elevation_max: Math.round(eleMax),
    elevation_min: Math.round(eleMin),
  };
}

export function extractTimeInfo(points: TrackPoint[], gpxString?: string): TimeInfo {
  let firstTime = "";
  let lastTime = "";

  for (const pt of points) {
    if (pt.time) {
      if (!firstTime) firstTime = pt.time;
      lastTime = pt.time;
    }
  }

  if (!firstTime && gpxString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxString, "application/xml");
    const metaTime = doc.querySelector("metadata > time");
    if (metaTime?.textContent) {
      firstTime = metaTime.textContent.trim();
      lastTime = firstTime;
    }
  }

  let duration = "";
  if (firstTime && lastTime) {
    const start = new Date(firstTime);
    const end = new Date(lastTime);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.round((diffMs % 3600000) / 60000);
      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
  }

  return {
    startDate: firstTime ? firstTime.slice(0, 10) : "",
    endDate: lastTime ? lastTime.slice(0, 10) : "",
    duration,
  };
}
