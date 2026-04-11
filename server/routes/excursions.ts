import { Router } from "express";
import { checkAuth } from "../middleware/auth.js";
import { findAll } from "../controllers/excursioController.js";

const router = Router();

router.get("/", checkAuth, findAll);

export default router;
