import { Router } from "express";
import { rateLimit } from "../utils/rateLimiter.js";
import { getServiceBaseUrl, getServiceHeaders } from "../utils/externalServices.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.get("/observations", async (req, res) => {
  const { d1, d2, perPage } = req.query;

  if (!process.env.INATURALIST_USER) {
    logger.error("INATURALIST_USER environment variable is not set");
    return res.status(500).json({ error: "Configuration error" });
  }

  const baseUrl = getServiceBaseUrl("inaturalist");
  const headers = getServiceHeaders("inaturalist");

  const params = new URLSearchParams();
  params.set("user_login", process.env.INATURALIST_USER);
  params.set("photos", "true");
  params.set("order", "asc");
  params.set("oder_by", "observed_on");
  params.set("geo", "true");
  params.set("geoprivacy", "open");
  if (d1) params.set("d1", d1 as string);
  if (d2) params.set("d2", d2 as string);
  if (perPage) params.set("per_page", perPage as string);

  const url = `${baseUrl}/observations?${params.toString()}`;

  try {
    const response = await rateLimit("inaturalist", async () => {
      return fetch(url, { headers });
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.error("Failed to fetch from iNaturalist:", err);
    res.status(500).json({ error: "Failed to fetch from iNaturalist" });
  }
});

export default router;
