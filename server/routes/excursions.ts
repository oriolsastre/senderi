import { Router, Request, Response } from "express";
import { findAll, findBySlug, create, findById, update, remove } from "../controllers/excursioController.js";
import { findByExcursio, addToExcursio, removeFromExcursio, toggleExcursioWaypointPrivat } from "../controllers/waypointController.js";
import { checkAuth, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../utils/rateLimiter.js";
import { getServiceBaseUrl, getServiceHeaders } from "../utils/externalServices.js";
import { logger } from "../utils/logger.js";
import { parseGPXStats } from "../utils/gpxParser.js";

const router = Router();

router.get("/", checkAuth, findAll);
router.get("/:slug", checkAuth, findBySlug);
router.post("/", requireAuth, create);
router.get("/:osmId/gpx", async (req: Request, res: Response) => {
  const { osmId } = req.params;
  const filename = req.query.filename as string | undefined;
  const baseUrl = getServiceBaseUrl("osm");
  const headers = getServiceHeaders("osm");
  const gpxUrl = `${baseUrl}/trace/${osmId}/data`;

  try {
    const response = await rateLimit("osm", async () => {
      return fetch(gpxUrl, { headers });
    });
    if (!response.ok) {
      return res.status(500).send("Failed to fetch GPX");
    }
    const gpxData = await response.text();
    res.setHeader("Content-Type", "application/gpx+xml");
    if (filename) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.gpx"`);
    }
    res.send(gpxData);
  } catch (err) {
    logger.error("Failed to fetch GPX:", err);
    res.status(500).send("Failed to fetch GPX");
  }
});
router.get("/:osmId/gpx/stats", async (req: Request, res: Response) => {
  const { osmId } = req.params;
  const baseUrl = getServiceBaseUrl("osm");
  const headers = getServiceHeaders("osm");
  const gpxUrl = `${baseUrl}/trace/${osmId}/data`;

  try {
    const response = await rateLimit("osm", async () => {
      return fetch(gpxUrl, { headers });
    });
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch GPX" });
    }
    const gpxData = await response.text();
    
    const stats = parseGPXStats(gpxData);
    res.json(stats);
  } catch (err) {
    logger.error("Failed to calculate GPX stats:", err);
    res.status(500).json({ error: "Failed to calculate GPX stats" });
  }
});
router.get("/:id/waypoints", checkAuth, findByExcursio);
router.post("/:id/waypoints", requireAuth, addToExcursio);
router.delete("/:id/waypoints/:waypointId", requireAuth, removeFromExcursio);
router.patch("/:id/waypoints/:waypointId/privat", requireAuth, toggleExcursioWaypointPrivat);
router.get("/:id", requireAuth, findById);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;
