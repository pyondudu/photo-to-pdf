import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // 相對路徑，之後部署到 GitHub Pages 等子路徑也能用
  base: "./",
  plugins: [
    // 開發用自簽 HTTPS：手機透過區網連線時才拿得到相機
    basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "文件掃描",
        short_name: "掃描",
        description: "拍照後自動拉平文件，輸出 A4 PDF",
        lang: "zh-TW",
        display: "standalone",
        theme_color: "#111418",
        background_color: "#111418",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png}"],
        // OpenCV.js 約 13MB，要調高上限才能離線快取
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
    }),
  ],
});
