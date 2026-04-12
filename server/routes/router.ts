import { Router } from "express";
import authRouter from "./auth.js";
import excursionsRouter from "./excursions.js";
import inaturalistRouter from "./inaturalist.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/excursions", excursionsRouter);
apiRouter.use("/inaturalist", inaturalistRouter);

export default apiRouter;