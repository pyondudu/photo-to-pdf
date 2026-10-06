// 文件濾鏡：原色 / 增強 / 灰階 / 黑白
import { loadOpenCv } from "./scanner.js";

export const FILTERS = {
  original: "原色",
  enhance: "增強",
  gray: "灰階",
  bw: "黑白",
};

// 回傳套用濾鏡後的新 canvas（不修改輸入）
export async function applyFilter(canvas, filter) {
  const cv = await loadOpenCv();
  const src = cv.imread(canvas);
  let result;

  if (filter === "enhance") {
    const rgb = new cv.Mat();
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    const channels = new cv.MatVector();
    cv.split(rgb, channels);
    for (let i = 0; i < 3; i++) {
      const ch = channels.get(i);
      flattenLighting(cv, ch);
      channels.set(i, ch);
      ch.delete();
    }
    cv.merge(channels, rgb);
    channels.delete();
    sharpen(cv, rgb);
    result = rgb;
  } else if (filter === "gray" || filter === "bw") {
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    flattenLighting(cv, gray);
    if (filter === "bw") {
      cv.threshold(gray, gray, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    } else {
      sharpen(cv, gray);
    }
    result = gray;
  } else {
    result = src.clone();
  }

  const out = document.createElement("canvas");
  cv.imshow(out, result);
  src.delete();
  result.delete();
  return out;
}

// 去陰影：估計紙張背景亮度後相除，讓紙變白、字維持深色
function flattenLighting(cv, ch) {
  const background = new cv.Mat();
  const kernel = cv.Mat.ones(7, 7, cv.CV_8U);
  cv.dilate(ch, background, kernel);
  cv.medianBlur(background, background, 21);
  cv.divide(ch, background, ch, 255);
  background.delete();
  kernel.delete();
}

function sharpen(cv, mat) {
  const blurred = new cv.Mat();
  cv.GaussianBlur(mat, blurred, new cv.Size(0, 0), 2);
  cv.addWeighted(mat, 1.5, blurred, -0.5, 0, mat);
  blurred.delete();
}
