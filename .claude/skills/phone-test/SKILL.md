---
name: phone-test
description: 啟動 HTTPS dev server，並一步步引導使用者在 Android / iPhone 實機上測試掃描 App。
disable-model-invocation: true
---

在真實手機上測試這個 PWA。使用者是程式新手，每一步都要說清楚要做什麼、預期看到什麼。

1. **檢查專案**：確認 `package.json` 存在。若沒有 `node_modules`，先說明並執行 `npm install`。
2. **檢查 HTTPS**：「加到主畫面」和離線使用需要 HTTPS。確認 `vite.config.js` 有啟用 `@vitejs/plugin-basic-ssl`（`plugins: [basicSsl()]`）。沒有的話，說明原因並詢問是否要加入（`npm install -D @vitejs/plugin-basic-ssl`）。
   - **檢查是否為虛擬機**：執行 `systemd-detect-virt` 和 `ip -4 route`。如果是 VMware 且使用 NAT（IP 是 VMware 的內部網段），手機連不到這台電腦，**不要啟動 server**：
     - 已經部署到 GitHub Pages（看 PROGRESS.md）→ 請使用者用手機打開該網址，直接跳到步驟 5。
     - 還沒部署 → 說明原因，建議先完成 PROGRESS.md 裡的部署步驟（或請使用者把 VMware 網路改成橋接）。
3. **啟動 server**：用 Bash 的 `run_in_background` 執行 `npm run dev`，從輸出找出 `Network: https://<區網IP>:5173/` 網址。如果已經有 server 在跑，直接沿用。
4. **引導使用者連線**（用條列、白話說明）：
   - 手機和這台電腦要連同一個 Wi-Fi。
   - 用手機瀏覽器打開上面的 https 網址（Android 用 Chrome，iPhone 用 Safari）。
   - 會出現「不安全/憑證」警告，這是開發用的自簽憑證，屬正常現象：
     - Android Chrome：點「進階」→「繼續前往（不安全）」。
     - iPhone Safari：點「顯示詳細資訊」→「造訪此網站」→ 再確認一次。
   - 按「拍照」會開啟手機內建相機；第一次可能要允許相機權限。
   - 連不上時：確認同一個 Wi-Fi、電腦防火牆是否擋住 5173 port。
5. **測試清單**（請使用者逐項回報結果）：
   - [ ] 可以連拍多頁
   - [ ] 自動偵測到文件四角，且可以手動拖曳調整
   - [ ] 拉平後文件是正的、沒有變形
   - [ ] 濾鏡（增強/黑白）效果正常
   - [ ] 輸出的 PDF 每頁都是 A4、頁數與順序正確
   - [ ] PDF 檔案大小合理（例如每頁不超過約 500KB）
   - [ ] 分享 / 下載 PDF 成功（iPhone 特別確認）
6. 測完後提醒使用者：要停止 server 時告訴你，你會把背景程序關掉。
