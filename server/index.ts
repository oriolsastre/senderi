import express from "express";
import cookieParser from "cookie-parser";
import ViteExpress from "vite-express";
import authRouter from "./routes/auth.js";

const app = express();

app.use(cookieParser());

app.use("/api", authRouter);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server running at http://localhost:3000")
);
