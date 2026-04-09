import express from "express";
import ViteExpress from "vite-express";

const app = express();

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server running at http://localhost:3000")
);
