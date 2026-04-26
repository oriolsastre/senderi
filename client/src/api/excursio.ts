import { Excursio } from "../types/excursio";

export async function getExcursions(): Promise<Excursio[]> {
  const response = await fetch("/api/excursions");
  if (!response.ok) throw new Error("Failed to fetch excursions");
  return response.json();
}

export async function getExcursio(slug: string): Promise<Excursio> {
  const response = await fetch(`/api/excursions/${slug}`);
  if (!response.ok) throw new Error("Failed to fetch excursion");
  return response.json();
}

export async function updateExcursio(id: number, data: { titol?: string; data_inici?: string; data_final?: string; distancia?: number; desnivell_pos?: number; desnivell_neg?: number; osm?: number | null; descripcio?: string | null; foto_password?: string }): Promise<Excursio> {
  const response = await fetch(`/api/excursions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update");
  return response.json();
}

export async function createExcursio(data: { titol: string; data_inici: string; data_final: string; distancia?: number; desnivell_pos?: number; desnivell_neg?: number; osm?: number | null; descripcio?: string | null; privat?: number }): Promise<Excursio> {
  const response = await fetch("/api/excursions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create excursion");
  return response.json();
}
