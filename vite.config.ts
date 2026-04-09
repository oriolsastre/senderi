import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "client",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
