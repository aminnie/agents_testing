import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
const backendPort = Number(process.env.BACKEND_PORT || 4000);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: frontendPort,
    proxy: {
      "/api": `http://localhost:${backendPort}`
    }
  }
});
