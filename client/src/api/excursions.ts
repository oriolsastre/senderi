import { Excursio } from "../types/excursio";

export async function getExcursions(): Promise<Excursio[]> {
  const response = await fetch("/api/excursions");
  if (!response.ok) throw new Error("Failed to fetch excursions");
  return response.json();
}
