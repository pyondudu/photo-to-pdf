# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 目前進度（每次對話開始必讀）

@PROGRESS.md

- 每次新對話的第一個回覆，先用 3～5 行提醒使用者「目前進度」和「下一步」（依 PROGRESS.md），再處理使用者的請求。
- 完成某個步驟後，要更新 PROGRESS.md（勾選完成的項目、改「最後更新」日期）。

## 專案目標

手機文件掃描 PWA（類似「掃描全能王」），自己與同事共用，不上架。
流程：拍照（可連拍多頁）→ 自動偵測文件四角（可手動微調）→ 透視校正拉平 → 增強/黑白濾鏡 → 合併輸出成一個 PDF。
只輸出 PDF，不做 JPG 輸出。

- 測試照片：參考截圖已由使用者移出資料夾（2026-10-06）。需要測邊框偵測時，請使用者放幾張照片進專案根目錄（`.gitignore` 會排除 `/*.jpg`），若是掃描全能王截圖要先裁掉上下的 App 介面。
- `文件掃描App_說明.txt`：給同事的 LINE 說明文字（使用者自己排版過，每行約 17 個全形字內避免 LINE 折行，括號引號用半形）。改 App 功能時記得同步更新。

## 部署

- 網址：https://pyondudu.github.io/photo-to-pdf/ （repo：https://github.com/pyondudu/photo-to-pdf ，**public**）
- push 到 `main` 後，`.github/workflows/deploy.yml` 會自動 build 並部署（約 1 分鐘），可用 `gh run watch` 確認。手機上的 PWA 會自動更新（可能要關掉 App 重開一兩次）。
- repo 是公開的：`.gitignore` 已排除根目錄的 `*.jpg`、`*.pdf`（參考截圖、報價單）。commit 前用 `git status` 確認沒有敏感檔案。
- 同事已在正式使用（Android + iPhone 都測過）：push 到 `main` 就等於更新給所有人，push 前要先在電腦端測過。
- 使用者從 Windows 拖曳檔案進 VM 時，VMware 會在 `~/.cache/vmware/drag_and_drop/` 留副本；刪除敏感檔案時要一併提醒清理（2026-10-06 已清空過一次）。
- git 身分：名字 `Forever1407`、email 用 GitHub noreply 地址（不公開使用者的 Gmail）。

## 指令

- `npm run dev`：開發用 HTTPS server（已加 `--host`；但這台 VM 是 NAT，手機連不到，實機測試用 GitHub Pages）
- `npm run build` / `npm run preview`：正式版建置與預覽
- `node scripts/make-icons.mjs`：重新產生 `public/` 的 PWA 圖示

## 架構

- Vite + 原生 JavaScript（不用框架），npm 管理套件。第一版用手機內建相機（`<input capture>`），沒有即時取景框。
- 邊框偵測與拉平：`@techstark/opencv-js`，演算法參考 jscanify 自己寫在 `src/scanner.js`（不用 npm 的 jscanify，它會連帶安裝 Node 端的 `canvas` 原生套件）。
- OpenCV 必須用 `?url` + `<script>` 載入再取 `window.cv`，**不能 `import`**：打包後的 CJS interop 會把它的 Promise 包成假 Promise，`await` 時拋出 "incompatible receiver"。
- 每頁只保留 JPEG Blob（原圖 0.92、輸出 0.7），不長期保存 canvas，避免 iOS 的 canvas 記憶體上限。
- PDF：jsPDF。每頁固定 A4 直式，影像等比縮放置中。
- 所有影像處理都在瀏覽器內完成，**不得上傳照片到任何伺服器**（文件含報價、印章等敏感資料）。

## 輸出規則

- 檔名：「PDF 已完成」畫面可直接輸入檔名（預設 `掃描_日期_時間`），由 `toPdfFilename()`（`src/pdf.js`）自動補 `.pdf` 並過濾不合法字元。
- 預設壓縮：頁面影像以 canvas 轉 JPEG（quality 約 0.7）、長邊上限約 2000px 再放入 PDF，避免檔案過大。
- 下載：iOS Safari 對 `<a download>` 支援不穩，優先用 `navigator.share({ files })`，不支援時才 fallback 為下載連結。`share()` 必須在點擊事件中直接呼叫，所以先產生 PDF，再讓使用者按「分享 / 儲存」。

## 必須同時支援 Android Chrome 與 iOS Safari

- PWA 安裝與離線快取（service worker）都**需要 HTTPS**。開發時用 `@vitejs/plugin-basic-ssl` 的自簽憑證（見 `/phone-test`）；自簽憑證下 service worker 註冊失敗屬正常現象，正式部署後才會作用。
- iPhone 照片可能是 HEIC 或帶 EXIF 旋轉，處理前先用 `createImageBitmap` / canvas 正規化方向。
- 手機記憶體有限：多頁時處理完一頁就釋放大型 canvas / OpenCV Mat（`mat.delete()`）。
- 開發機是 **VMware 虛擬機（NAT 網路）**：手機無法用區網 IP 連到 dev server。實機測試要用部署到 GitHub Pages 後的網址（或請使用者把 VMware 網路改成橋接）。

## 與使用者協作

- 使用者是程式新手：每次說明要一步步來，包含要執行的指令、在哪裡執行、預期看到什麼。
- 改動 UI 或影像處理後，提醒使用者用 `/phone-test` 在真實手機上驗證（Android 與 iPhone 都要）。
- 需要輸入密碼或互動選擇的指令（`sudo`、`gh auth login`）**不能用 `! 指令`**（拿不到終端機），要請使用者另開終端機（`Ctrl+Alt+T`）執行。
