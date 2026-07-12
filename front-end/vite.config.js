/* global process, __dirname */
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
    port: process.env.PORT || 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 👈 thêm alias
    },
  },
});