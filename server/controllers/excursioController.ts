import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import * as excursioModel from "../models/excursio.js";

export function findAll(req: AuthenticatedRequest, res: Response) {
  if (req.isAuthenticated) {
    const excursions = excursioModel.findAll();
    return res.json(excursions);
  } else {
    const excursions = excursioModel.findPublic();
    return res.json(excursions);
  }
}
