import { Router, Request, Response } from "express";
import { findAll, findBySlug, create, findById, update, remove } from "../controllers/excursioController.js";
import { findByExcursion, addToExcursion, removeFromExcursion } from "../controllers/waypointController.js";
import { checkAuth, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../utils/rateLimiter.js";
import { logger } from "../utils/logger.js";
import { parseGPXStats } from "../utils/gpxParser.js";

const router = Router();

router.get("/", checkAuth, findAll);
router.get("/:slug", checkAuth, findBySlug);
router.post("/", requireAuth, create);
router.get("/:osmId/gpx", async (req: Request, res: Response) => {
  const { osmId } = req.params;
  const gpxUrl = `https://www.openstreetmap.org/trace/${osmId}/data`;

  try {
    const response = await rateLimit("osm", async () => {
      return fetch(gpxUrl, {
        headers: {
          "User-Agent": "Senderi/1.0 (oriol.sastre+senderi@gmail.com)"
        }
      });
    });
    if (!response.ok) {
      return res.status(500).send("Failed to fetch GPX");
    }
    const gpxData = await response.text();
    res.setHeader("Content-Type", "application/gpx+xml");
    res.send(gpxData);
  } catch (err) {
    logger.error("Failed to fetch GPX:", err);
    res.status(500).send("Failed to fetch GPX");
  }
});
router.get("/:osmId/gpx/stats", async (req: Request, res: Response) => {
  const { osmId } = req.params;
  const gpxUrl = `https://www.openstreetmap.org/trace/${osmId}/data`;

  try {
    const response = await rateLimit("osm", async () => {
      return fetch(gpxUrl, {
        headers: {
          "User-Agent": "Senderi/1.0 (oriol.sastre+senderi@gmail.com)"
        }
      });
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
router.get("/:id/waypoints", checkAuth, findByExcursion);
router.post("/:id/waypoints", requireAuth, addToExcursion);
router.delete("/:id/waypoints/:waypointId", requireAuth, removeFromExcursion);
router.get("/:id", requireAuth, findById);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;
