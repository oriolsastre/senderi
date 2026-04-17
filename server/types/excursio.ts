export interface Excursio {
  id: number;
  titol: string;
  descripcio: string | null;
  distancia: number;
  desnivell_pos: number;
  desnivell_neg: number;
  osm: number | null;
  data_inici: string;
  data_final: string;
  slug: string;
  privat: number;
  created_at: string;
  updated_at: string;
}

export interface PublicExcursio {
  id: number;
  titol: string;
  descripcio: string | null;
  distancia: number;
  desnivell_pos: number;
  desnivell_neg: number;
  osm: number | null;
  data_inici: string;
  data_final: string;
  slug: string;
}
