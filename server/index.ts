import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import apiRouter from "./routes/router.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api", apiRouter);

app.use(express.static(path.resolve(process.cwd(), "client/dist")));

app.get(".{0,}", (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), "client/dist/index.html"));
});

const server = app.listen(process.env.PORT, () => {
  console.log("Server running at http://localhost:" + process.env.PORT);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
