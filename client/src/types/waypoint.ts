export interface Waypoint {
  id: number;
  nom: string | null;
  elevacio: number | null;
  lat: number;
  lon: number;
  tipus: string;
  comentari: string | null;
  descripcio: string | null;
  wikidata: string | null;
  icgc?: string;
  osm_node: number | null;
  privat: number;
  ordre?: number;
  excursio_privat?: number;
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
  GEODESIA: "geodesia",
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
  geodesia: "Vèrtex geodèsic",
  altres: "Altres",
};

export const waypointIconMap: Record<string, string> = {
  cim: "mountain",
  coll: "coll",
  font: "font",
  aigua: "aigua",
  cascada: "cascada",
  cova: "cova",
  ruina: "ruina",
  ermita: "ermita",
  masia: "masia",
  edifici: "edifici",
  natura: "natura",
  refugi: "cabin",
  geodesia: "geodesia",
  altres: "altres",
};