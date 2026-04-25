export interface Waypoint {
  id: number;
  nom: string | null;
  lat: number;
  lon: number;
  tipus: string;
  elevacio?: number | null;
  comentari?: string;
  descripcio?: string;
  wikidata?: string;
  osm_node?: number;
  privat?: number;
}

export const WaypointTypes = {
  CIM: "cim",
  COLL: "coll",
  ERMITA: "ermita",
  MASIA: "masia",
  RUINA: "ruina",
  FONT: "font",
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
  cascada: "Cascada",
  cova: "Cova",
  natura: "Natura",
  edifici: "Edifici",
  refugi: "Refugi",
  altres: "Altres",
};