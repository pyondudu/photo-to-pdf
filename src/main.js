// 主畫面：頁面清單、拍照、產生 PDF
import { loadImage, canvasToBlob, releaseCanvas } from "./image.js";
import { loadOpenCv, detectCorners, warp } from "./scanner.js";
import { FILTERS, applyFilter } from "./filters.js";
import { editCorners } from "./cornerEditor.js";
import {
  buildPdf,
  pdfFilename,
  sharePdf,
  downloadPdf,
  formatSize,
} from "./pdf.js";

const $ = (sel) => document.querySelector(sel);

// 每頁只保留壓縮後的 JPEG Blob，不長期佔用 canvas 記憶體
// { original: Blob, corners, filter, jpeg: Blob, width, height, thumbUrl }
const pages = [];
let defaultFilter = "enhance";

const ORIGINAL_QUALITY = 0.92;
const OUTPUT_QUALITY = 0.7;

// ---------- 處理中提示 ----------

function showBusy(text) {
  $("#busyText").textContent = text;
  $("#busy").hidden = false;
}

function hideBusy() {
  $("#busy").hidden = true;
}

async function withBusy(text, task) {
  showBusy(text);
  try {
    return await task();
  } catch (err) {
    console.error(err);
    alert(err.message || "發生錯誤，請再試一次。");
  } finally {
    hideBusy();
  }
}

// 第一次載入影像處理模組比較久，提示使用者
async function ensureOpenCv() {
  let loaded = false;
  const timer = setTimeout(() => {
    if (!loaded) showBusy("第一次使用，正在載入影像處理模組…");
  }, 300);
  try {
    await loadOpenCv();
  } finally {
    loaded = true;
    clearTimeout(timer);
  }
}

// ---------- 頁面處理 ----------

// 依四角與濾鏡重新產生該頁的輸出影像
async function renderPage(page, source) {
  const warped = await warp(source, page.corners);
  const filtered = await applyFilter(warped, page.filter);
  page.jpeg = await canvasToBlob(filtered, OUTPUT_QUALITY);
  page.width = filtered.width;
  page.height = filtered.height;
  if (page.thumbUrl) URL.revokeObjectURL(page.thumbUrl);
  page.thumbUrl = URL.createObjectURL(page.jpeg);
  releaseCanvas(warped);
  releaseCanvas(filtered);
}

async function addFiles(files) {
  for (const [i, file] of [...files].entries()) {
    const label = files.length > 1 ? `（${i + 1}/${files.length}）` : "";
    await ensureOpenCv();
    showBusy(`偵測文件邊框中…${label}`);
    let source;
    try {
      source = await loadImage(file);
      const detected = await detectCorners(source);
      hideBusy();
      const corners = await editCorners(source, detected);
      if (!corners) continue;
      showBusy(`處理中…${label}`);
      const page = { corners, filter: defaultFilter };
      page.original = await canvasToBlob(source, ORIGINAL_QUALITY);
      await renderPage(page, source);
      pages.push(page);
      renderList();
    } catch (err) {
      console.error(err);
      alert(err.message || "照片處理失敗，請再試一次。");
    } finally {
      hideBusy();
      if (source) releaseCanvas(source);
    }
  }
}

async function readjustPage(page) {
  await ensureOpenCv();
  const source = await loadImage(page.original);
  hideBusy();
  try {
    const corners = await editCorners(source, page.corners);
    if (!corners) return;
    page.corners = corners;
    await withBusy("處理中…", () => renderPage(page, source));
    renderList();
  } finally {
    releaseCanvas(source);
  }
}

async function changeFilter(targets, filter) {
  await ensureOpenCv();
  await withBusy("套用濾鏡中…", async () => {
    for (const page of targets) {
      if (page.filter === filter) continue;
      page.filter = filter;
      const source = await loadImage(page.original);
      await renderPage(page, source);
      releaseCanvas(source);
    }
  });
  renderList();
}

// ---------- 畫面 ----------

function filterOptions(selected) {
  return Object.entries(FILTERS)
    .map(
      ([key, name]) =>
        `<option value="${key}"${key === selected ? " selected" : ""}>${name}</option>`,
    )
    .join("");
}

function renderList() {
  const list = $("#pages");
  list.innerHTML = "";
  pages.forEach((page, i) => {
    const li = document.createElement("li");
    li.className = "page";
    li.innerHTML = `
      <img alt="第 ${i + 1} 頁" src="${page.thumbUrl}" />
      <div class="page-body">
        <div class="page-head">
          <span class="page-no">第 ${i + 1} 頁</span>
          <select aria-label="濾鏡">${filterOptions(page.filter)}</select>
        </div>
        <div class="page-tools">
          <button class="btn small" data-act="adjust">調整邊框</button>
          <button class="btn small" data-act="up" ${i === 0 ? "disabled" : ""}>上移</button>
          <button class="btn small" data-act="down" ${i === pages.length - 1 ? "disabled" : ""}>下移</button>
          <button class="btn small ghost delete" data-act="delete">刪除</button>
        </div>
      </div>`;
    li.querySelector("select").onchange = (e) =>
      changeFilter([page], e.target.value);
    li.querySelectorAll("[data-act]").forEach((btn) => {
      btn.onclick = () => pageAction(btn.dataset.act, i);
    });
    list.append(li);
  });

  const hasPages = pages.length > 0;
  $("#empty").hidden = hasPages;
  $("#toolbar").hidden = !hasPages;
  $("#makePdf").disabled = !hasPages;
}

function pageAction(action, i) {
  const page = pages[i];
  if (action === "adjust") return readjustPage(page);
  if (action === "delete") {
    if (!confirm(`確定刪除第 ${i + 1} 頁？`)) return;
    URL.revokeObjectURL(page.thumbUrl);
    pages.splice(i, 1);
  }
  if (action === "up") [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
  if (action === "down") [pages[i], pages[i + 1]] = [pages[i + 1], pages[i]];
  renderList();
}

// ---------- 產生 PDF ----------

let lastPdf = null;

async function makePdf() {
  const blob = await withBusy("產生 PDF 中…", () => buildPdf(pages));
  if (!blob) return;
  lastPdf = { blob, filename: pdfFilename() };
  $("#resultInfo").textContent =
    `${lastPdf.filename}・${pages.length} 頁・${formatSize(blob.size)}`;
  $("#result").hidden = false;
}

// ---------- 事件 ----------

for (const input of [$("#camera"), $("#gallery")]) {
  input.onchange = async () => {
    const files = [...input.files];
    input.value = ""; // 讓同一張照片可以再選一次
    if (files.length) await addFiles(files);
  };
}

$("#filterAll").innerHTML =
  `<option value="" disabled selected>全部套用濾鏡</option>${filterOptions()}`;
$("#filterAll").onchange = async (e) => {
  defaultFilter = e.target.value;
  e.target.value = "";
  await changeFilter(pages, defaultFilter);
};

$("#clearAll").onclick = () => {
  if (!confirm("確定清除所有頁面？")) return;
  pages.forEach((p) => URL.revokeObjectURL(p.thumbUrl));
  pages.length = 0;
  renderList();
};

$("#makePdf").onclick = makePdf;

$("#resultShare").onclick = async () => {
  try {
    const shared = await sharePdf(lastPdf.blob, lastPdf.filename);
    if (!shared) downloadPdf(lastPdf.blob, lastPdf.filename);
  } catch (err) {
    console.error(err);
    downloadPdf(lastPdf.blob, lastPdf.filename);
  }
};
$("#resultDownload").onclick = () =>
  downloadPdf(lastPdf.blob, lastPdf.filename);
$("#resultClose").onclick = () => ($("#result").hidden = true);

// 離開前提醒（避免誤關分頁丟失已拍的頁面）
window.addEventListener("beforeunload", (e) => {
  if (pages.length) e.preventDefault();
});

// 開啟後在背景預先載入 OpenCV，拍完照就不用等
setTimeout(() => loadOpenCv().catch(console.error), 1500);

renderList();
