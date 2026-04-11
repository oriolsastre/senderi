import express from "express";
import cookieParser from "cookie-parser";
import ViteExpress from "vite-express";
import apiRouter from "./routes/router.js";

const app = express();

app.use(cookieParser());

app.use("/api", apiRouter);

ViteExpress.listen(app, 3000, () =>
  console.log("Server running at http://localhost:3000")
);
