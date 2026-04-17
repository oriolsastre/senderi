export type WaypointTipus = "Cim" | "Ermita" | "Coll" | "Altres";

export interface Waypoint {
  id: number;
  nom: string;
  elevacio: number | null;
  lat: number;
  lon: number;
  tipus: WaypointTipus;
  comentari: string | null;
  osm_node: number | null;
  wikidata: number | null;
  privat: number;
}

export interface CreateWaypoint {
  nom: string;
  elevacio?: number;
  lat: number;
  lon: number;
  tipus?: WaypointTipus;
  comentari?: string;
  osm_node?: number;
  wikidata?: number;
  privat?: number;
}

export interface UpdateWaypoint {
  nom?: string;
  elevacio?: number;
  lat?: number;
  lon?: number;
  tipus?: WaypointTipus;
  comentari?: string;
  osm_node?: number;
  wikidata?: number;
  privat?: number;
}

export interface WaypointWithPrivat extends Waypoint {
  ordre: number;
  excursion_privat: number;
}