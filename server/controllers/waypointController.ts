import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as waypointModel from "../models/waypoint.js";
import type { CreateWaypoint, UpdateWaypoint, Waypoint } from "../types/waypoint.js";

function formatWaypoint(waypoint: Waypoint) {
  const { elevacio, osm_node, wikidata, ...rest } = waypoint;
  return {
    ...rest,
    elevacio: elevacio ?? undefined,
    osm_node: osm_node ?? undefined,
    wikidata: wikidata ?? undefined,
  };
}

export function findAll(req: AuthenticatedRequest, res: Response) {
  const filters: waypointModel.WaypointFilters = {};
  
  if (req.query.tipus) filters.tipus = req.query.tipus as string;
  if (req.query.max_lat) filters.max_lat = parseFloat(req.query.max_lat as string);
  if (req.query.min_lat) filters.min_lat = parseFloat(req.query.min_lat as string);
  if (req.query.max_lon) filters.max_lon = parseFloat(req.query.max_lon as string);
  if (req.query.min_lon) filters.min_lon = parseFloat(req.query.min_lon as string);

  const waypoints = waypointModel.findAll(!!req.isAuthenticated, filters);
  const response = waypoints.map(formatWaypoint);
  return res.json(response);
}

export function findById(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const waypoint = waypointModel.findById(id);
  if (!waypoint) {
    return res.status(404).json({ error: "Not found" });
  }

  if (waypoint.privat === 1 && !req.isAuthenticated) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json(formatWaypoint(waypoint));
}

export function create(req: AuthenticatedRequest, res: Response) {
  const data = req.body as CreateWaypoint;
  const waypoint = waypointModel.create(data);
  res.status(201).json(formatWaypoint(waypoint));
}

export function update(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const data = req.body as UpdateWaypoint;
  const waypoint = waypointModel.update(id, data);

  if (!waypoint) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json(formatWaypoint(waypoint));
}

export function remove(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const deleted = waypointModel.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(204).send();
}

export function findByExcursion(req: AuthenticatedRequest, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const waypoints = waypointModel.findByExcursion(id, !!req.isAuthenticated);
  const response = waypoints.map((w) => ({
    ...formatWaypoint(w),
    ordre: w.ordre,
    excursion_privat: w.excursion_privat,
  }));
  return res.json(response);
}

export function addToExcursion(req: AuthenticatedRequest, res: Response) {
  const excursionId = parseInt(req.params.id as string, 10);
  if (isNaN(excursionId)) {
    return res.status(400).json({ error: "Invalid excursion ID" });
  }

  const { waypoint_id, privat } = req.body as { waypoint_id: number; privat?: number };
  if (!waypoint_id) {
    return res.status(400).json({ error: "waypoint_id is required" });
  }

  const added = waypointModel.addToExcursion(excursionId, waypoint_id, privat ?? 0);
  if (!added) {
    return res.status(400).json({ error: "Failed to add waypoint" });
  }

  res.status(201).json({ message: "Waypoint added to excursion" });
}

export function removeFromExcursion(req: AuthenticatedRequest, res: Response) {
  const excursionId = parseInt(req.params.id as string, 10);
  const waypointId = parseInt(req.params.waypointId as string, 10);

  if (isNaN(excursionId) || isNaN(waypointId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const removed = waypointModel.removeFromExcursion(excursionId, waypointId);
  if (!removed) {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(204).send();
}