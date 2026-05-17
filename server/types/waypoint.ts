export type WaypointTipus = "cim" | "coll" | "ermita" | "masia" | "ruina" | "font" | "cascada" | "cova" | "natura" | "edifici" | "geodesia" | "altres";

export interface Waypoint {
  id: number;
  nom: string;
  elevacio: number | null;
  lat: number;
  lon: number;
  tipus: WaypointTipus;
  comentari: string | null;
  descripcio: string | null;
  osm_node: number | null;
  wikidata: string | null;
  icgc: string | null;
  privat: number;
}

export interface CreateWaypoint {
  nom: string;
  elevacio?: number;
  lat: number;
  lon: number;
  tipus?: WaypointTipus;
  comentari?: string;
  descripcio?: string;
  osm_node?: number;
  wikidata?: string;
  icgc?: string;
  privat?: number;
}

export interface UpdateWaypoint {
  nom?: string;
  elevacio?: number;
  lat?: number;
  lon?: number;
  tipus?: WaypointTipus;
  comentari?: string;
  descripcio?: string;
  osm_node?: number;
  wikidata?: string;
  icgc?: string;
  privat?: number;
}

export interface WaypointWithPrivat extends Waypoint {
  ordre: number;
  excursio_privat: number;
}