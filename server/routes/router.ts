import { Router } from "express";
import authRouter from "./auth.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter)

export default apiRouter;