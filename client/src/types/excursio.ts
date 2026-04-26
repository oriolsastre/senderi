export interface Excursio {
  id?: number;
  titol: string;
  descripcio: string | null;
  distancia: number;
  desnivell_pos: number;
  desnivell_neg: number;
  osm: number | null;
  data_inici: string;
  data_final: string;
  slug: string;
  privat?: number;
  foto_password?: string;
  foto_privat?: boolean;
  created_at?: string;
  updated_at?: string;
}
