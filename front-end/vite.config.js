import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
export default defineConfig({
  plugins: [
    react(),      
    tailwindcss(),
  ],
  server: {
    port: process.env.PORT || 3000,
    strictPort: false,
    middlewareMode: false,
    watch: {
      usePolling: false,
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: process.env.PORT || 3000,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    sourcemap: true,
    minify: 'terser',
  },
});
