# 專案進度

最後更新：2026-10-06

## 已完成

- `/init` 設定：`CLAUDE.md`、`/phone-test` skill、Prettier 自動排版 hook（`.claude/settings.json`）
- 第一版 App：拍照／相簿 → 自動偵測四角（可拖曳調整）→ 拉平 → 濾鏡（原色／增強／灰階／黑白）→ A4 PDF → 分享／下載
- 電腦端測試通過（Playwright 模擬手機）：2 頁 A4 PDF，約 141 KB

## 卡住的地方

開發機是 VMware 虛擬機（NAT 網路），手機連不到這台電腦的 dev server，所以還沒在真實手機上測過。
→ 決定改用 **GitHub Pages** 部署，拿到固定的 https 網址，給手機測試和同事使用。

## 下一步：部署到 GitHub Pages

- [x] 1. 安裝 git 與 gh（`!` 無法輸入密碼，要另開終端機執行 `sudo apt install -y git gh`）
- [x] 2. 設定 git 的使用者名稱與 email（名字 `Forever1407`；email 用 GitHub noreply 地址，不公開 Gmail）
- [x] 3. 登入 GitHub 帳號 `pyondudu`（`gh auth login` 也要在另開的終端機執行）
- [x] 4. `git init` 並做第一次 commit（`.gitignore` 已排除 node_modules、dist、根目錄的 jpg 截圖與報價單 PDF）
- [ ] 5. 用 `gh repo create` 建立 repo（免費帳號的 GitHub Pages 需要 public repo，要先跟使用者說明）
- [x] 6. 加上 GitHub Actions workflow（`.github/workflows/deploy.yml`），自動 build 並部署 `dist/`（`vite.config.js` 已設定 `base: "./"`）
- [ ] 7. 手機打開 `https://<帳號>.github.io/<repo>/`，照 `/phone-test` 的清單測試（Android + iPhone），並測「加到主畫面」

## 之後的待辦

- 用真實手機照片調整邊框偵測（深色桌面、多張紙疊在一起等情況）
- ESLint、Vitest（測 PDF 頁數、A4、壓縮大小）
- 視需要再做 App 內的即時取景框
