export interface Waypoint {
  id: number;
  nom: string | null;
  lat: number;
  lon: number;
  tipus: string;
  comentari?: string;
  wikidata?: number;
  osm_node?: number;
}