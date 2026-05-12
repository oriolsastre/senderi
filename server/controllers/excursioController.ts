import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as excursioModel from "../models/excursio.js";
import { findByExcursio } from "../models/waypoint.js";
import { PublicExcursio, AuthExcursio } from "../types/excursio.js";

function toPublicExcursio(excursio: excursioModel.Excursio): PublicExcursio {
  const { privat, foto_password, created_at, updated_at, ...publicExcursio } = excursio;
  return { ...publicExcursio, foto_privat: !!(foto_password && foto_password.length > 0) };
}

function formatExcursio(excursio: excursioModel.Excursio): AuthExcursio {
  const { created_at, updated_at, ...rest } = excursio;
  return { ...rest, foto_privat: !!(excursio.foto_password && excursio.foto_password.length > 0) };
}

function isPrivate(excursio: excursioModel.Excursio, isAuthenticated?: boolean): boolean {
  return excursio.privat === 1 && !isAuthenticated;
}

export function findAll(req: AuthenticatedRequest, res: Response) {
  const excursions = excursioModel.findAll();

  if (req.isAuthenticated) {
    const response = excursions.map(formatExcursio);
    return res.json(response);
  } else {
    const publicExcursions = excursions
      .filter((e) => e.privat === 0)
      .map(toPublicExcursio);
    return res.json(publicExcursions);
  }
}

export function findBySlug(req: AuthenticatedRequest, res: Response) {
  const isAuth = req.isAuthenticated as boolean;
  const slug = req.params.slug as string;
  const includeWaypoints = req.query.waypoints === 'true' || req.query.waypoints === '1';
  const excursio = excursioModel.findBySlug(slug);

  if (!excursio || isPrivate(excursio, isAuth)) {
    return res.status(404).json({ error: "Not found" });
  }

  const result = isAuth ? formatExcursio(excursio) : toPublicExcursio(excursio);
  if (includeWaypoints) result.fites = findByExcursio(excursio.id, isAuth);
  res.header("Cache-Control", "public, max-age=43200");
  return res.json(result);
}

export function create(req: AuthenticatedRequest, res: Response) {
  const excursio = excursioModel.create(req.body);
  res.status(201).json(formatExcursio(excursio));
}

export function findById(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const excursio = excursioModel.findById(id);

  if (!excursio || isPrivate(excursio, req.isAuthenticated)) {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.isAuthenticated) {
    return res.json(formatExcursio(excursio));
  } else {
    return res.json(toPublicExcursio(excursio));
  }
}

export function update(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const excursio = excursioModel.update(id, req.body);

  if (!excursio) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json(formatExcursio(excursio));
}

export function findVeins(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const excursio = excursioModel.findById(id);

  if (!excursio) {
    return res.status(404).json({ error: "Not found" });
  }

  const veins = excursioModel.findAdjacent(excursio.data_inici, !!req.isAuthenticated);
  res.header("Cache-Control", "public, max-age=172800");
  return res.json(veins);
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
