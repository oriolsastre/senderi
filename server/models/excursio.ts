import db from "../db.js";

export interface Excursio {
  id: number;
  titol: string;
  descripcio: string | null;
  distancia: number;
  desnivell_pos: number;
  desnivell_neg: number;
  osm: number | null;
  data: string;
  slug: string;
  privat: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExcursio {
  titol: string;
  descripcio?: string;
  distancia?: number;
  desnivell_pos?: number;
  desnivell_neg?: number;
  osm?: number;
  data?: string;
  slug?: string;
  privat?: number;
}

export interface UpdateExcursio {
  titol?: string;
  descripcio?: string;
  distancia?: number;
  desnivell_pos?: number;
  desnivell_neg?: number;
  osm?: number;
  data?: string;
  slug?: string;
  privat?: number;
}

export function slugify(date: string, title: string): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return `${date}-${normalized}`;
}

function generateUniqueSlug(date: string, title: string): string {
  let baseSlug = slugify(date, title);
  let slug = baseSlug;
  let counter = 1;

  while (db.prepare("SELECT 1 FROM excursions WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export function findAll(): Excursio[] {
  return db.prepare("SELECT * FROM excursions ORDER BY data DESC").all() as Excursio[];
}

export function findById(id: number): Excursio | undefined {
  return db.prepare("SELECT * FROM excursions WHERE id = ?").get(id) as Excursio | undefined;
}

export function findBySlug(slug: string): Excursio | undefined {
  return db.prepare("SELECT * FROM excursions WHERE slug = ?").get(slug) as Excursio | undefined;
}

export function create(data: CreateExcursio): Excursio {
  const stmt = db.prepare(`
    INSERT INTO excursions (titol, descripcio, distancia, desnivell_pos, desnivell_neg, osm, data, slug, privat)
    VALUES (@titol, @descripcio, @distancia, @desnivell_pos, @desnivell_neg, @osm, @data, @slug, @privat)
  `);
  const finalData = data.data ?? new Date().toISOString().split("T")[0];
  const result = stmt.run({
    titol: data.titol,
    descripcio: data.descripcio ?? null,
    distancia: data.distancia ?? 0,
    desnivell_pos: data.desnivell_pos ?? 0,
    desnivell_neg: data.desnivell_neg ?? 0,
    osm: data.osm ?? null,
    data: finalData,
    slug: data.slug ?? generateUniqueSlug(finalData, data.titol),
    privat: data.privat ?? 0,
  });
  return findById(result.lastInsertRowid as number)!;
}

export function update(id: number, data: UpdateExcursio): Excursio | undefined {
  const current = findById(id);
  if (!current) return undefined;

  const fields: string[] = [];
  const values: Record<string, unknown> = { id };

  if (data.titol !== undefined) { fields.push("titol = @titol"); values.titol = data.titol; }
  if (data.descripcio !== undefined) { fields.push("descripcio = @descripcio"); values.descripcio = data.descripcio; }
  if (data.distancia !== undefined) { fields.push("distancia = @distancia"); values.distancia = data.distancia; }
  if (data.desnivell_pos !== undefined) { fields.push("desnivell_pos = @desnivell_pos"); values.desnivell_pos = data.desnivell_pos; }
  if (data.desnivell_neg !== undefined) { fields.push("desnivell_neg = @desnivell_neg"); values.desnivell_neg = data.desnivell_neg; }
  if (data.osm !== undefined) { fields.push("osm = @osm"); values.osm = data.osm; }
  if (data.data !== undefined) { fields.push("data = @data"); values.data = data.data; }
  if (data.slug !== undefined) { fields.push("slug = @slug"); values.slug = data.slug; }
  if (data.privat !== undefined) { fields.push("privat = @privat"); values.privat = data.privat; }

  if (fields.length === 0) return current;

  fields.push("updated_at = CURRENT_TIMESTAMP");

  const stmt = db.prepare(`UPDATE excursions SET ${fields.join(", ")} WHERE id = @id`);
  stmt.run(values);
  return findById(id);
}

export function remove(id: number): boolean {
  const stmt = db.prepare("DELETE FROM excursions WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
