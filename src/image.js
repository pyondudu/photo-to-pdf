// 照片讀取與 canvas / Blob 轉換

// 長邊上限：A4 印出約 170 dpi，畫質足夠且手機記憶體吃得消
const MAX_SIDE = 2000;

// 讀取照片檔，套用 EXIF 方向並縮到長邊 ≤ MAX_SIDE，回傳 canvas
export async function loadImage(file) {
  const source = await decode(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  return canvas;
}

async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // 部分瀏覽器的 createImageBitmap 不支援某些格式，改用 <img> 解碼
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error("無法讀取這張照片的格式，請改用 JPG 或 PNG。");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("影像轉檔失敗"))),
      "image/jpeg",
      quality,
    );
  });
}

// iOS 對 canvas 總記憶體有上限，用完要把尺寸歸零才會釋放
export function releaseCanvas(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}
