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
