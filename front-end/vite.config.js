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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/antd')) return 'vendor-antd';
          if (id.includes('node_modules/echarts')) return 'vendor-echarts';
          if (id.includes('node_modules/motion')) return 'vendor-motion';
          if (id.includes('node_modules/gsap')) return 'vendor-gsap';
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
