import { Router } from "express";
import authRouter from "./auth.js";
import excursionsRouter from "./excursions.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/excursions", excursionsRouter);

export default apiRouter;