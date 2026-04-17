import { Router } from "express";
import { checkAuth, requireAuth } from "../middleware/auth.js";
import { findAll, findById, create, update, remove } from "../controllers/waypointController.js";

const router = Router();

router.get("/", checkAuth, findAll);
router.get("/:id", checkAuth, findById);
router.post("/", requireAuth, create);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;