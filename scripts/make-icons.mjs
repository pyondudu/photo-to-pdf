// 產生 PWA 圖示（綠底白色文件），執行：node scripts/make-icons.mjs
// 不依賴任何套件：自己畫像素並編碼成 PNG
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BG = [25, 179, 148];
const PAPER = [255, 255, 255];
const LINE = [170, 220, 208];

function draw(size) {
  const px = new Uint8Array(size * size * 3);
  const set = (x, y, c) => px.set(c, (y * size + x) * 3);
  const u = size / 100; // 以 100x100 為設計格

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / u;
      const gy = y / u;
      let c = BG;
      // 文件本體（右上角折角）
      const inPaper = gx >= 28 && gx <= 72 && gy >= 20 && gy <= 80;
      const inFold = gx - 60 > gy - 20; // 右上角被切掉的三角形
      if (inPaper && !inFold) c = PAPER;
      // 文字線條
      if (c === PAPER && gx >= 35 && gx <= 65) {
        for (const ly of [40, 50, 60, 70]) {
          if (gy >= ly && gy <= ly + 3 && !(ly === 70 && gx > 55)) c = LINE;
        }
      }
      set(x, y, c);
    }
  }
  return px;
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const px = draw(size);
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    Buffer.from(px.buffer, y * size * 3, size * 3).copy(
      raw,
      y * (size * 3 + 1) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public", { recursive: true });
writeFileSync("public/icon-192.png", png(192));
writeFileSync("public/icon-512.png", png(512));
writeFileSync("public/apple-touch-icon.png", png(180));
console.log("圖示已產生在 public/");
