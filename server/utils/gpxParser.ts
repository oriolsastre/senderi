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

function calculateDistance(points: TrackPoint[]): number[] {
  const distances: number[] = [0];
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    const R = 6371e3;
    const φ1 = (prev.lat * Math.PI) / 180;
    const φ2 = (curr.lat * Math.PI) / 180;
    const Δφ = ((curr.lat - prev.lat) * Math.PI) / 180;
    const Δλ = ((curr.lon - prev.lon) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    distances.push(distances[i - 1] + distance);
  }
  
  return distances;
}

export function parseGPXStats(gpxString: string): GPXStats {
  const points = parseGPX(gpxString);
  
  if (points.length === 0) {
    return {
      distance: 0,
      elevation_gain: 0,
      elevation_loss: 0,
      elevation_max: 0,
      elevation_min: 0,
    };
  }
  
  const distances = calculateDistance(points);
  const elevations = points.map(p => p.ele);
  
  let elevation_gain = 0;
  let elevation_loss = 0;
  
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) {
      elevation_gain += diff;
    } else {
      elevation_loss += Math.abs(diff);
    }
  }
  
  return {
    distance: distances[distances.length - 1],
    elevation_gain: Math.round(elevation_gain),
    elevation_loss: Math.round(elevation_loss),
    elevation_max: Math.round(Math.max(...elevations)),
    elevation_min: Math.round(Math.min(...elevations)),
  };
}