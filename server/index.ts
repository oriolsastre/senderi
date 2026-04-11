import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes/router.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cookieParser());

app.use("/api", apiRouter);

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get(".{0,}", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
