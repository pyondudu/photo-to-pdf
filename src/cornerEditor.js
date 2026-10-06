// 四角調整畫面：在照片上拖曳四個圓點，讓框貼齊文件邊緣
import { fullImageCorners } from "./scanner.js";

const editor = document.querySelector("#editor");
const stage = document.querySelector("#stage");
const frame = document.querySelector("#stageFrame");
const view = document.querySelector("#stageCanvas");
const polygon = document.querySelector("#stagePolygon");
const handles = [...document.querySelectorAll(".handle")];

// 回傳調整後的四角（原圖座標），按取消回傳 null
export function editCorners(source, initialCorners) {
  return new Promise((resolve) => {
    editor.hidden = false;
    const points = initialCorners.map((p) => ({ ...p }));

    // 依可用空間等比縮放顯示
    const scale = Math.min(
      stage.clientWidth / source.width,
      stage.clientHeight / source.height,
    );
    const cssW = Math.round(source.width * scale);
    const cssH = Math.round(source.height * scale);
    const dpr = window.devicePixelRatio || 1;
    frame.style.width = `${cssW}px`;
    frame.style.height = `${cssH}px`;
    view.width = Math.round(cssW * dpr);
    view.height = Math.round(cssH * dpr);
    view.getContext("2d").drawImage(source, 0, 0, view.width, view.height);

    const draw = () => {
      points.forEach((p, i) => {
        handles[i].style.transform =
          `translate(${p.x * scale}px, ${p.y * scale}px)`;
      });
      polygon.setAttribute(
        "points",
        points.map((p) => `${p.x * scale},${p.y * scale}`).join(" "),
      );
    };
    draw();

    handles.forEach((handle, i) => {
      handle.onpointerdown = (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        handle.classList.add("active");
      };
      handle.onpointermove = (e) => {
        if (!handle.hasPointerCapture(e.pointerId)) return;
        const rect = frame.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), cssW);
        const y = Math.min(Math.max(e.clientY - rect.top, 0), cssH);
        points[i] = { x: x / scale, y: y / scale };
        draw();
      };
      handle.onpointerup = handle.onpointercancel = () =>
        handle.classList.remove("active");
    });

    const finish = (result) => {
      editor.hidden = true;
      view.width = 0;
      view.height = 0;
      resolve(result);
    };
    document.querySelector("#editorCancel").onclick = () => finish(null);
    document.querySelector("#editorOk").onclick = () => finish(points);
    document.querySelector("#editorFull").onclick = () => {
      points.splice(0, 4, ...fullImageCorners(source));
      draw();
    };
  });
}
