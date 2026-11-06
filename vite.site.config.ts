import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O site público (domios.pt): outro deploy do mesmo repo. Entrada própria em
// site/, sem o código da app. A Api lê-se de VITE_API_BASE_URL, como na app.
export default defineConfig({
  root: "site",
  envDir: "..",
  plugins: [react()],
  server: { port: 5174 },
  build: { outDir: "../dist-site", emptyOutDir: true },
});
