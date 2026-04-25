import db from "../db.js";
import type { Waypoint, CreateWaypoint, UpdateWaypoint, WaypointWithPrivat } from "../types/waypoint.js";

export interface WaypointFilters {
  tipus?: string;
  max_lat?: number;
  min_lat?: number;
  max_lon?: number;
  min_lon?: number;
  no_excursio?: number;
}

export function findAll(isAuthenticated: boolean, filters?: WaypointFilters): Waypoint[] {
  const fields = isAuthenticated ? "*" : "id, nom, elevacio, lat, lon, tipus, descripcio, osm_node, wikidata";
  let query = isAuthenticated ? `SELECT ${fields} FROM waypoints` : `SELECT ${fields} FROM waypoints WHERE privat = 0`;
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters?.tipus) {
    conditions.push("tipus = @tipus");
    params.tipus = filters.tipus;
  }
  if (filters?.max_lat !== undefined) {
    conditions.push("lat <= @max_lat");
    params.max_lat = filters.max_lat;
  }
  if (filters?.min_lat !== undefined) {
    conditions.push("lat >= @min_lat");
    params.min_lat = filters.min_lat;
  }
  if (filters?.max_lon !== undefined) {
    conditions.push("lon <= @max_lon");
    params.max_lon = filters.max_lon;
  }
  if (filters?.min_lon !== undefined) {
    conditions.push("lon >= @min_lon");
    params.min_lon = filters.min_lon;
  }
  if (filters?.no_excursio !== undefined) {
    conditions.push("id NOT IN (SELECT waypoint_id FROM excursions_waypoints WHERE excursio_id = @no_excursio)");
    params.no_excursio = filters.no_excursio;
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY nom";

  if (Object.keys(params).length > 0) {
    return db.prepare(query).all(params) as Waypoint[];
  }
  return db.prepare(query).all() as Waypoint[];
}

export function findById(id: number, isAuthenticated: boolean = false): Waypoint | undefined {
  const fields = isAuthenticated ? "*" : "id, nom, elevacio, lat, lon, tipus, descripcio, osm_node, wikidata";
  return db.prepare(`SELECT ${fields} FROM waypoints WHERE id = ?`).get(id) as Waypoint | undefined;
}

export function create(data: CreateWaypoint): Waypoint {
  const stmt = db.prepare(`
    INSERT INTO waypoints (nom, elevacio, lat, lon, tipus, comentari, descripcio, osm_node, wikidata, privat)
    VALUES (@nom, @elevacio, @lat, @lon, @tipus, @comentari, @descripcio, @osm_node, @wikidata, @privat)
  `);
  const result = stmt.run({
    nom: data.nom,
    elevacio: data.elevacio ?? null,
    lat: data.lat,
    lon: data.lon,
    tipus: data.tipus ?? "Altres",
    comentari: data.comentari ?? null,
    descripcio: data.descripcio ?? null,
    osm_node: data.osm_node ?? null,
    wikidata: data.wikidata ?? null,
    privat: data.privat ?? 0,
  });
  return findById(result.lastInsertRowid as number, true)!;
}

export function update(id: number, data: UpdateWaypoint): Waypoint | undefined {
  const current = findById(id, true);
  if (!current) return undefined;

  const fields: string[] = [];
  const values: Record<string, unknown> = { id };

  if (data.nom !== undefined) { fields.push("nom = @nom"); values.nom = data.nom; }
  if (data.elevacio !== undefined) { fields.push("elevacio = @elevacio"); values.elevacio = data.elevacio; }
  if (data.lat !== undefined) { fields.push("lat = @lat"); values.lat = data.lat; }
  if (data.lon !== undefined) { fields.push("lon = @lon"); values.lon = data.lon; }
  if (data.tipus !== undefined) { fields.push("tipus = @tipus"); values.tipus = data.tipus; }
  if (data.comentari !== undefined) { fields.push("comentari = @comentari"); values.comentari = data.comentari; }
  if (data.descripcio !== undefined) { fields.push("descripcio = @descripcio"); values.descripcio = data.descripcio; }
  if (data.osm_node !== undefined) { fields.push("osm_node = @osm_node"); values.osm_node = data.osm_node; }
  if (data.wikidata !== undefined) { fields.push("wikidata = @wikidata"); values.wikidata = data.wikidata; }
  if (data.privat !== undefined) { fields.push("privat = @privat"); values.privat = data.privat; }

  if (fields.length === 0) return current;

  const stmt = db.prepare(`UPDATE waypoints SET ${fields.join(", ")} WHERE id = @id`);
  stmt.run(values);
  return findById(id, true);
}

export function remove(id: number): boolean {
  const stmt = db.prepare("DELETE FROM waypoints WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export interface ExcursioWaypoint {
  excursio_id: number;
  waypoint_id: number;
  ordre: number;
  privat: number;
}

export function findByExcursio(excursioId: number, isAuthenticated: boolean): WaypointWithPrivat[] {
  const query = isAuthenticated
    ? `SELECT w.*, ew.ordre, ew.privat as excursio_privat 
       FROM waypoints w 
       JOIN excursions_waypoints ew ON w.id = ew.waypoint_id 
       WHERE ew.excursio_id = ?
       ORDER BY ew.ordre`
    : `SELECT w.*, ew.ordre, ew.privat as excursio_privat 
       FROM waypoints w 
       JOIN excursions_waypoints ew ON w.id = ew.waypoint_id 
       WHERE ew.excursio_id = ? AND w.privat = 0 AND ew.privat = 0
       ORDER BY ew.ordre`;
  return db.prepare(query).all(excursioId) as WaypointWithPrivat[];
}

export function addToExcursio(excursioId: number, waypointId: number, privat: number = 0): boolean {
  const stmt = db.prepare(`
    INSERT INTO excursions_waypoints (excursio_id, waypoint_id, ordre, privat)
    VALUES (?, ?, (SELECT COALESCE(MAX(ordre), 0) + 1 FROM excursions_waypoints WHERE excursio_id = ?), ?)
  `);
  const result = stmt.run(excursioId, waypointId, excursioId, privat);
  return result.changes > 0;
}

export function removeFromExcursio(excursioId: number, waypointId: number): boolean {
  const stmt = db.prepare("DELETE FROM excursions_waypoints WHERE excursio_id = ? AND waypoint_id = ?");
  const result = stmt.run(excursioId, waypointId);
  return result.changes > 0;
}

export function updateExcursioWaypoint(excursioId: number, waypointId: number, privat: number): boolean {
  const stmt = db.prepare("UPDATE excursions_waypoints SET privat = ? WHERE excursio_id = ? AND waypoint_id = ?");
  const result = stmt.run(privat, excursioId, waypointId);
  return result.changes > 0;
}

export interface WaypointExcursio {
  id: number;
  titol: string;
  data_inici: string;
  slug: string;
  privat: number;
}

export function findExcursionsByWaypoint(waypointId: number, isAuthenticated: boolean): WaypointExcursio[] {
  let query = `
    SELECT e.id, e.titol, e.data_inici, e.slug, ew.privat
    FROM excursions e
    JOIN excursions_waypoints ew ON e.id = ew.excursio_id
    WHERE ew.waypoint_id = ?
  `;
  
  if (!isAuthenticated) {
    query += " AND e.privat = 0 AND ew.privat = 0";
  }
  
  query += " ORDER BY e.data_inici DESC";
  
  return db.prepare(query).all(waypointId) as WaypointExcursio[];
}