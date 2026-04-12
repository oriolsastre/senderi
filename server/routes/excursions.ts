import { Router } from "express";
import { checkAuth, requireAuth } from "../middleware/auth.js";
import { findAll, findBySlug, findById, create, update, remove } from "../controllers/excursioController.js";

const router = Router();

router.get("/", checkAuth, findAll);
router.get("/:slug", checkAuth, findBySlug);
router.post("/", requireAuth, create);
router.get("/:osmId/gpx", async (req, res) => {
  const { osmId } = req.params;
  const gpxUrl = `https://www.openstreetmap.org/trace/${osmId}/data`;
  
  try {
    const response = await fetch(gpxUrl);
    if (!response.ok) {
      return res.status(500).send("Failed to fetch GPX");
    }
    const gpxData = await response.text();
    res.setHeader("Content-Type", "application/gpx+xml");
    res.send(gpxData);
  } catch {
    res.status(500).send("Failed to fetch GPX");
  }
});
router.get("/:id", requireAuth, findById);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;
