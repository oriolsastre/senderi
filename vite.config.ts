import { defineConfig, loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    root: "client",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client"),
      },
    },
    server: {
      proxy: {
        "/api": `http://localhost:${env.PORT || 3991}`,
      },
    },
  };
});
