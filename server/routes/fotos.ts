import { Router } from "express";
import path from "path";
import fs from "fs";
import { checkAuth, AuthenticatedRequest } from "../middleware/auth.js";
import * as excursioModel from "../models/excursio.js";
import { Excursio } from "../types/excursio.js";
import { ZipArchive } from "archiver";
import { logger } from "../utils/logger.js";

const fotosRouter = Router();

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function getDateFromFolder(folder: string): string {
  return `${folder.slice(0, 4)}-${folder.slice(4, 6)}-${folder.slice(6, 8)}`;
}

function canAccessPrivate(
  req: AuthenticatedRequest,
  codi: string | undefined,
  excursions: Excursio[]
): boolean {
  return req.isAuthenticated || excursions.some(e => e.foto_password && e.foto_password === codi);
}

function getImageFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return [];
  }
  return fs.readdirSync(dirPath).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  });
}

fotosRouter.get("/:folder", checkAuth, (req: AuthenticatedRequest, res) => {
  const folder = req.params.folder as string;
  const codi = req.query.codi as string | undefined;
  const date = getDateFromFolder(folder);
  const excursions = excursioModel.findByDataInici(date);
  if (excursions.length === 0) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const isAuthenticated = req.isAuthenticated;
  const hasValidPassword = canAccessPrivate(req, codi, excursions);
  const canAccessPrivateFiles = isAuthenticated || hasValidPassword;

  const fotosDir = path.resolve(process.cwd(), "fotos", folder);
  if (!fs.existsSync(fotosDir) || !fs.statSync(fotosDir).isDirectory()) {
    return res.status(404).json({ error: "Folder not found" });
  }
  const files = getImageFiles(fotosDir);

  let privateFiles: { filename: string; birthtime: number }[] = [];
  if (canAccessPrivateFiles) {
    const privatDir = path.resolve(fotosDir, "privat");
    const privFiles = getImageFiles(privatDir);
    privateFiles = privFiles.map(f => {
      const stat = fs.statSync(path.join(privatDir, f));
      return {
        filename: `privat/${f}`,
        birthtime: stat.birthtimeMs || stat.ctimeMs
      };
    });
  }

  const allFiles = files.map(f => {
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

fotosRouter.post("/:folder/zip", checkAuth, (req: AuthenticatedRequest, res) => {
  const folder = req.params.folder as string;
  const codi = req.query.codi as string | undefined;
  const date = getDateFromFolder(folder);
  const excursions = excursioModel.findByDataInici(date);
  if (excursions.length === 0) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const isAuthenticated = req.isAuthenticated;
  const hasValidPassword = canAccessPrivate(req, codi, excursions);
  const canAccessPrivateFiles = isAuthenticated || hasValidPassword;

  const fotosDir = path.resolve(process.cwd(), "fotos", folder);
  if (!fs.existsSync(fotosDir) || !fs.statSync(fotosDir).isDirectory()) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const allFiles: { path: string; name: string }[] = [];

  for (const file of getImageFiles(fotosDir)) {
    allFiles.push({ path: path.join(fotosDir, file), name: file });
  }

  if (canAccessPrivateFiles) {
    const privatDir = path.resolve(fotosDir, "privat");
    for (const file of getImageFiles(privatDir)) {
      allFiles.push({ path: path.join(privatDir, file), name: `privat/${file}` });
    }
  }

  if (allFiles.length === 0) {
    return res.status(404).json({ error: "Folder not found" });
  }

  const zipFilename = excursions.length === 1 ? excursions[0].slug : folder;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}.zip"`);

  const archive = new ZipArchive({ zlib: { level: 5 } });

  archive.on("warning", (err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      logger.warn("Archive warning:", err);
    } else {
      throw err;
    }
  });

  archive.on("error", (err: Error) => {
    logger.error("Archive error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create zip" });
    }
  });

  archive.pipe(res);

  for (const { path: filePath, name } of allFiles) {
    const entryName = name.startsWith("privat/") ? name.slice(7) : name;
    archive.file(filePath, { name: entryName });
  }

  archive.finalize().then(() => {
    logger.info(`Zip created for ${zipFilename}: ${allFiles.length} files`);
  }).catch((err: Error) => {
    logger.error("Finalize error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to finalize zip" });
    }
  });
});

export default fotosRouter;