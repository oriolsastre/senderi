import { Router } from "express";
import path from "path";
import fs from "fs";
import { checkAuth, AuthenticatedRequest } from "../middleware/auth.js";
import * as excursioModel from "../models/excursio.js";
import authRouter from "./auth.js";
import excursionsRouter from "./excursions.js";
import inaturalistRouter from "./inaturalist.js";
import waypointsRouter from "./waypoints.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/excursions", excursionsRouter);
apiRouter.use("/inaturalist", inaturalistRouter);
apiRouter.use("/waypoints", waypointsRouter);

apiRouter.get("/fotos/:folder", checkAuth, (req: AuthenticatedRequest, res) => {
  const folder = req.params.folder as string;
  const codi = req.query.codi as string | undefined;
  const date = `${folder.slice(0, 4)}-${folder.slice(4, 6)}-${folder.slice(6, 8)}`;
  const excursions = excursioModel.findByDataInici(date);
  if (excursions.length === 0) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const isAuthenticated = req.isAuthenticated;
  const hasValidPassword = excursions.some(e => e.foto_password && e.foto_password === codi);
  const canAccessPrivate = isAuthenticated || hasValidPassword;

  const fotosDir = path.resolve(process.cwd(), "fotos", folder);
  if (!fs.existsSync(fotosDir) || !fs.statSync(fotosDir).isDirectory()) {
    return res.status(404).json({ error: "Folder not found" });
  }
  const files = fs.readdirSync(fotosDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
  });

  let privateFiles: { filename: string; birthtime: number }[] = [];
  if (canAccessPrivate) {
    const privatDir = path.resolve(process.cwd(), "fotos", folder, "privat");
    if (fs.existsSync(privatDir) && fs.statSync(privatDir).isDirectory()) {
      privateFiles = fs.readdirSync(privatDir).filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      }).map((f) => {
        const stat = fs.statSync(path.join(privatDir, f));
        return {
          filename: `privat/${f}`,
          birthtime: stat.birthtimeMs || stat.ctimeMs
        };
      });
    }
  }

  const allFiles = files.map((f) => {
    const stat = fs.statSync(path.join(fotosDir, f));
    return {
      filename: f,
      birthtime: stat.birthtimeMs || stat.ctimeMs
    };
  }).concat(privateFiles).sort((a, b) => a.birthtime - b.birthtime);

  const response = isAuthenticated 
    ? allFiles 
    : allFiles.map(({ birthtime, ...rest }) => rest);

  res.json(response);
});

export default apiRouter;