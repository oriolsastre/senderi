import { Router } from "express";
import { checkAuth, requireAuth } from "../middleware/auth.js";
import { findAll, findBySlug, findById, create, update, remove } from "../controllers/excursioController.js";

const router = Router();

router.get("/", checkAuth, findAll);
router.get("/:slug", checkAuth, findBySlug);
router.post("/", requireAuth, create);
router.get("/:id", requireAuth, findById);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;
