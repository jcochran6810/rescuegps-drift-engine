import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {},
    hmr: {
      clientPort: 443,
      protocol: "wss",
    },
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0",
  },
});
