# 專案進度

最後更新：2026-10-06

## 已完成

- `/init` 設定：`CLAUDE.md`、`/phone-test` skill、Prettier 自動排版 hook（`.claude/settings.json`）
- 第一版 App：拍照／相簿 → 自動偵測四角（可拖曳調整）→ 拉平 → 濾鏡（原色／增強／灰階／黑白）→ A4 PDF → 分享／下載
- 電腦端測試通過（Playwright 模擬手機）：2 頁 A4 PDF，約 141 KB
- 手機實測（2026-10-06）：拍 2 頁 → 分享到 LINE、下載，手機與電腦都能正常開啟
- 「PDF 已完成」畫面可直接輸入檔名（預設 `掃描_日期_時間`，自動補 `.pdf`、過濾不合法字元）
- Android 實測通過（2026-10-06）：改檔名、分享到 LINE、下載、「安裝應用程式」到主畫面都正常
- iPhone 實測通過（2026-10-06，同事測試）：功能都可以使用
- 已把網址與使用說明（`文件掃描App_說明.txt`）用 LINE 發給同事

## 更新方式

改完程式後 `git commit` + `git push`，GitHub Actions 會自動重新部署（約 1 分鐘）。手機上的 PWA 會自動更新。

## 部署到 GitHub Pages（已完成）

- [x] 1. 安裝 git 與 gh（`!` 無法輸入密碼，要另開終端機執行 `sudo apt install -y git gh`）
- [x] 2. 設定 git 的使用者名稱與 email（名字 `Forever1407`；email 用 GitHub noreply 地址，不公開 Gmail）
- [x] 3. 登入 GitHub 帳號 `pyondudu`（`gh auth login` 也要在另開的終端機執行）
- [x] 4. `git init` 並做第一次 commit（`.gitignore` 已排除 node_modules、dist、根目錄的 jpg 截圖與報價單 PDF）
- [x] 5. 建立 public repo：https://github.com/pyondudu/photo-to-pdf（已部署到 https://pyondudu.github.io/photo-to-pdf/ ）
- [x] 6. 加上 GitHub Actions workflow（`.github/workflows/deploy.yml`），自動 build 並部署 `dist/`（`vite.config.js` 已設定 `base: "./"`）
- [x] 7. （Android ✅、iPhone ✅）手機打開 https://pyondudu.github.io/photo-to-pdf/ ，照 `/phone-test` 的清單測試（Android + iPhone），並測「加到主畫面」

## 下一步（可選，依使用者需求排優先順序）

- 用真實手機照片調整邊框偵測（深色桌面、多張紙疊在一起等情況）
- ESLint、Vitest（測 PDF 頁數、A4、壓縮大小）
- 視需要再做 App 內的即時取景框
