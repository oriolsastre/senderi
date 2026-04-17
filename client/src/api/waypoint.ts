export interface Waypoint {
  id: number;
  nom: string | null;
  elevacio: number | null;
  lat: number;
  lon: number;
  tipus: string;
  comentari: string | null;
  osm_node: number | null;
  wikidata: number | null;
  privat: number;
}

interface WaypointFilters {
  tipus?: string;
  max_lat?: number;
  min_lat?: number;
  max_lon?: number;
  min_lon?: number;
}

export async function getWaypoints(filters?: WaypointFilters): Promise<Waypoint[]> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.tipus) params.set("tipus", filters.tipus);
    if (filters.max_lat) params.set("max_lat", filters.max_lat.toString());
    if (filters.min_lat) params.set("min_lat", filters.min_lat.toString());
    if (filters.max_lon) params.set("max_lon", filters.max_lon.toString());
    if (filters.min_lon) params.set("min_lon", filters.min_lon.toString());
  }
  const url = "/api/waypoints" + (params.toString() ? "?" + params.toString() : "");
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch waypoints");
  return response.json();
}