import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as excursioModel from "../models/excursio.js";
import { PublicExcursio } from "../types/excursio.js";

function toPublicExcursio(excursion: excursioModel.Excursio): PublicExcursio {
  const { id, privat, created_at, updated_at, ...publicExcursio } = excursion;
  return publicExcursio;
}

function formatExcursion(excursion: excursioModel.Excursio) {
  const { created_at, updated_at, ...rest } = excursion;
  return rest;
}

function isPrivate(excursion: excursioModel.Excursio, isAuthenticated?: boolean): boolean {
  return excursion.privat === 1 && !isAuthenticated;
}

export function findAll(req: AuthenticatedRequest, res: Response) {
  const excursions = excursioModel.findAll();
  
  if (req.isAuthenticated) {
    const response = excursions.map(formatExcursion);
    return res.json(response);
  } else {
    const publicExcursions = excursions
      .filter((e) => e.privat === 0)
      .map(toPublicExcursio);
    return res.json(publicExcursions);
  }
}

export function findBySlug(req: AuthenticatedRequest, res: Response) {
  const slug = req.params.slug as string;
  const excursion = excursioModel.findBySlug(slug);

  if (!excursion) {
    return res.status(404).json({ error: "Not found" });
  }

  if (isPrivate(excursion, req.isAuthenticated)) {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.isAuthenticated) {
    return res.json(formatExcursion(excursion));
  } else {
    return res.json(toPublicExcursio(excursion));
  }
}

export function create(req: AuthenticatedRequest, res: Response) {
  const excursion = excursioModel.create(req.body);
  res.status(201).json(formatExcursion(excursion));
}

export function findById(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const excursion = excursioModel.findById(id);

  if (!excursion) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json(formatExcursion(excursion));
}

export function update(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const excursion = excursioModel.update(id, req.body);

  if (!excursion) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json(formatExcursion(excursion));
}

export function remove(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const deleted = excursioModel.remove(id);

  if (!deleted) {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(204).send();
}
