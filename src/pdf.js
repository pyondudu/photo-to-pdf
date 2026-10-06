// 產生 A4 PDF 與分享 / 下載
import { jsPDF } from "jspdf";

const A4 = { w: 210, h: 297 }; // mm
const MARGIN = 5; // mm

// pages: [{ jpeg: Blob, width, height }]，jpeg 已壓縮，直接放入不再重新編碼
export async function buildPdf(pages) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });
  for (const [i, page] of pages.entries()) {
    if (i > 0) doc.addPage("a4", "portrait");
    const scale = Math.min(
      (A4.w - 2 * MARGIN) / page.width,
      (A4.h - 2 * MARGIN) / page.height,
    );
    const w = page.width * scale;
    const h = page.height * scale;
    const data = new Uint8Array(await page.jpeg.arrayBuffer());
    doc.addImage(data, "JPEG", (A4.w - w) / 2, (A4.h - h) / 2, w, h);
  }
  return doc.output("blob");
}

export function pdfFilename(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `掃描_${d}_${pad(date.getHours())}${pad(date.getMinutes())}.pdf`;
}

// 必須在使用者點擊時直接呼叫（iOS 要求分享由點擊觸發）
export async function sharePdf(blob, filename) {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: filename });
  } catch (err) {
    if (err.name !== "AbortError") throw err;
  }
  return true;
}

export function downloadPdf(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
