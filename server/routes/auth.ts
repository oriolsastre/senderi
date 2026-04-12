import { Router } from "express";
import { status, login, logout } from "../controllers/authController.js";

const router = Router();

router.get("/status", status);
router.post("/login", login);
router.post("/logout", logout);

export default router;
