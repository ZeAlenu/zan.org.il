import { FRAMES, nodeOf } from "./chart";
import { boundsOf } from "./layout";

const NARROW = 700;
const MINIMAP_STRIP = 250;
const PAD = 16;
const LABEL_ABOVE = 48;
/** Room to the right of the houses for the axis words, after they are pulled inward. */
const LABEL_ROOM = 52;

function alliances(): { left: number; right: number; top: number; bottom: number } {
  const boxes = FRAMES.filter((frame) => frame.look === "redGreen" || frame.look === "liberty").map((frame) =>
    boundsOf(frame.members.map(nodeOf)),
  );
  return {
    left: Math.min(...boxes.map((box) => box.x)),
    right: Math.max(...boxes.map((box) => box.x + box.w)),
    top: Math.min(...boxes.map((box) => box.y)) - LABEL_ABOVE,
    bottom: Math.max(...boxes.map((box) => box.y + box.h)),
  };
}

export function openingViewport(width: number, height: number): { x: number; y: number; zoom: number } {
  if (width < 1 || height < 1) {
    return { x: 0, y: 0, zoom: 1 };
  }
  const scene = alliances();
  const span = scene.bottom - scene.top;
  let zoom = (height - 2 * PAD) / span;
  zoom = Math.min(1.35, Math.max(0.5, zoom));
  const focusWidth = scene.right - scene.left + LABEL_ROOM;
  if (focusWidth * zoom > width - 2 * PAD) {
    zoom = (width - 2 * PAD) / focusWidth;
  }
  const focus = (scene.left + scene.right + LABEL_ROOM) / 2;
  let viewLeft = focus - width / (2 * zoom);
  if (width >= NARROW) {
    const viewRight = scene.right + LABEL_ROOM + MINIMAP_STRIP / zoom;
    viewLeft = viewRight - width / zoom;
  }
  return { x: -viewLeft * zoom, y: PAD - scene.top * zoom, zoom };
}
