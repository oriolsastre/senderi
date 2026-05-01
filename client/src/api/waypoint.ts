export interface Waypoint {
  id: number;
  nom: string | null;
  elevacio: number | null;
  lat: number;
  lon: number;
  tipus: string;
  comentari: string | null;
  descripcio: string | null;
  osm_node: number | null;
  wikidata: string | null;
  privat: number;
  ordre?: number;
  excursio_privat?: number;
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

export async function getWaypoint(id: number): Promise<Waypoint> {
  const response = await fetch(`/api/waypoints/${id}`);
  if (!response.ok) throw new Error("Failed to fetch waypoint");
  return response.json();
}

export async function addWaypointToExcursio(excursioId: number, waypointId: number, privat: boolean = false): Promise<void> {
  const response = await fetch(`/api/excursions/${excursioId}/waypoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ waypoint_id: waypointId, privat: privat ? 1 : 0 }),
  });
  if (!response.ok) throw new Error("Failed to add waypoint to excursion");
}

export async function removeWaypointFromExcursio(excursioId: number, waypointId: number): Promise<void> {
  const response = await fetch(`/api/excursions/${excursioId}/waypoints/${waypointId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to remove waypoint from excursion");
}

export async function createWaypoint(data: {
  nom: string;
  tipus: string;
  lat: number;
  lon: number;
  elevacio?: number | null;
  comentari?: string;
  descripcio?: string;
  privat?: number;
  osm_node?: number;
  wikidata?: string;
}): Promise<Waypoint> {
  const body = { ...data };
  if (body.elevacio === undefined) {
    body.elevacio = null;
  }
  const response = await fetch("/api/waypoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to create waypoint");
  return response.json();
}

export async function updateWaypoint(id: number, data: {
  nom?: string;
  tipus?: string;
  lat?: number;
  lon?: number;
  elevacio?: number | null;
  comentari?: string;
  descripcio?: string;
  privat?: number;
  osm_node?: number;
  wikidata?: string;
}): Promise<Waypoint> {
  const body = { ...data };
  if (body.elevacio === undefined) {
    body.elevacio = null;
  }
  const response = await fetch(`/api/waypoints/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to update waypoint");
  return response.json();
}

export async function toggleExcursioWaypointPrivat(excursioId: number, waypointId: number): Promise<void> {
  const response = await fetch(`/api/excursions/${excursioId}/waypoints/${waypointId}/privat`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Failed to toggle waypoint privat");
}

export interface WaypointExcursio {
  id: number;
  titol: string;
  data_inici: string;
  slug: string;
  privat: number;
}

export async function getExcursionsByWaypoint(waypointId: number): Promise<WaypointExcursio[]> {
  const response = await fetch(`/api/waypoints/${waypointId}/excursions`);
  if (!response.ok) throw new Error("Failed to fetch excursions");
  return response.json();
}