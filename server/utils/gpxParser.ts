export interface GPXStats {
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  elevation_max: number;
  elevation_min: number;
}

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
}

function parseGPX(gpxString: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const trkptRegex = /<trkpt[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>[\s\S]*?<ele>([^<]+)<\/ele>/gi;

  let match;
  while ((match = trkptRegex.exec(gpxString)) !== null) {
    points.push({
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2]),
      ele: parseFloat(match[3]),
    });
  }

  return points;
}

const WGS84_A = 6378137;
const WGS84_B = 6356752.314245;
const WGS84_F = (WGS84_A - WGS84_B) / WGS84_A;

// https://www.movable-type.co.uk/scripts/latlong-vincenty.html:w
function vincentyDistance(p1: TrackPoint, p2: TrackPoint): number {
  const φ1 = p1.lat * Math.PI / 180;
  const φ2 = p2.lat * Math.PI / 180;
  const L = (p2.lon - p1.lon) * Math.PI / 180;

  const tanU1 = (1 - WGS84_F) * Math.tan(φ1);
  const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
  const sinU1 = tanU1 * cosU1;

  const tanU2 = (1 - WGS84_F) * Math.tan(φ2);
  const cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2);
  const sinU2 = tanU2 * cosU2;

  let λ = L;
  let sinλ = 0, cosλ = 0, sinσ = 0, cosσ = 0, σ = 0, cos2σm = 0, cosSqα = 0, λʹ = 0;
  let iter = 0;
  const maxIter = 100;

  do {
    sinλ = Math.sin(λ);
    cosλ = Math.cos(λ);
    const sinSqσ = (cosU2 * sinλ) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) ** 2;
    sinσ = Math.sqrt(sinSqσ);
    if (sinσ === 0) return 0;
    cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
    σ = Math.atan2(sinσ, cosσ);
    const sinα = cosU1 * cosU2 * sinλ / sinσ;
    cosSqα = 1 - sinα * sinα;
    if (cosSqα === 0) return 0;
    cos2σm = cosσ - 2 * sinU1 * sinU2 / cosSqα;
    const C = WGS84_F / 16 * cosSqα * (4 + WGS84_F * (4 - 3 * cosSqα));
    λʹ = λ;
    λ = L + (1 - C) * WGS84_F * sinα * (σ + C * sinσ * (cos2σm + C * cosσ * (-1 + 2 * cos2σm ** 2)));
    iter++;
  } while (Math.abs(λ - λʹ) > 1e-12 && iter < maxIter);

  if (iter >= maxIter) return 0;

  const uSq = cosSqα * (WGS84_A ** 2 - WGS84_B ** 2) / (WGS84_B ** 2);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const Δσ = B * sinσ * (cos2σm + B / 4 * (cosσ * (-1 + 2 * cos2σm ** 2) - B / 6 * cos2σm * (-3 + 4 * sinσ ** 2) * (-3 + 4 * cos2σm ** 2)));

  return WGS84_B * A * (σ - Δσ);
}

export function parseGPXStats(gpxString: string): GPXStats {
  const points = parseGPX(gpxString);

  if (points.length < 2) {
    return { distance: 0, elevation_gain: 0, elevation_loss: 0, elevation_max: 0, elevation_min: 0 };
  }

  if (isNaN(points[0].lat) || isNaN(points[0].lon)) {
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
    if (isNaN(p.lat) || isNaN(p.lon)) {
      continue;
    }

    totalDistance += vincentyDistance(points[i - 1], points[i]);

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