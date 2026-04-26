import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import apiRouter from "./routes/router.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api", apiRouter);

app.use("/fotos", express.static(path.resolve(process.cwd(), "fotos"), { index: false }));

app.use(express.static(path.resolve(process.cwd(), "client/dist")));

app.get("/*splat", (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), "client/dist/index.html"));
});

const server = app.listen(process.env.PORT, () => {
  logger.info("Server running at http://localhost:" + process.env.PORT);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
});

server.on("error", (err) => {
  logger.error("Server error:", err);
  process.exit(1);
});
