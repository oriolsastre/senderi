export interface Waypoint {
  id: number;
  nom: string | null;
  lat: number;
  lon: number;
  tipus: string;
  elevacio?: number | null;
  comentari?: string | null;
  descripcio?: string | null;
  wikidata?: string | null;
  osm_node?: number | null;
  privat?: number;
}

export const WaypointTypes = {
  CIM: "cim",
  COLL: "coll",
  ERMITA: "ermita",
  MASIA: "masia",
  RUINA: "ruina",
  FONT: "font",
  AIGUA: "aigua",
  CASCADA: "cascada",
  COVA: "cova",
  NATURA: "natura",
  EDIFICI: "edifici",
  REFUGI: "refugi",
  ALTRES: "altres",
} as const;

export type WaypointType = (typeof WaypointTypes)[keyof typeof WaypointTypes];

export const waypointTypeLabels: Record<WaypointType, string> = {
  cim: "Cim",
  coll: "Coll",
  ermita: "Ermita",
  masia: "Masia",
  ruina: "Ruïna",
  font: "Font",
  aigua: "Aigua",
  cascada: "Cascada",
  cova: "Cova",
  natura: "Natura",
  edifici: "Edifici",
  refugi: "Refugi",
  altres: "Altres",
};