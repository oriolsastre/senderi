import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as excursioModel from "../models/excursio.js";
import { PublicExcursio } from "../types/excursio.js";

function toPublicExcursio(excursion: excursioModel.Excursio): PublicExcursio {
  const { id, privat, created_at, updated_at, ...publicExcursio } = excursion;
  return publicExcursio;
}

export function findAll(req: AuthenticatedRequest, res: Response) {
  if (req.isAuthenticated) {
    const excursions = excursioModel.findAll();
    const response = excursions.map(({ created_at, updated_at, ...rest }) => rest);
    return res.json(response);
  } else {
    const excursions = excursioModel.findAll();
    const publicExcursions = excursions.map(toPublicExcursio);
    return res.json(publicExcursions);
  }
}
