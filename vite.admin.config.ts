import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Admin da plataforma (admin.domios.pt): outro deploy do mesmo repo, entrada própria em admin/.
export default defineConfig({
  root: "admin",
  envDir: "..",
  plugins: [react()],
  server: { port: 5175 },
  build: { outDir: "../dist-admin", emptyOutDir: true },
});
