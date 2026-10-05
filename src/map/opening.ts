import { FRAMES, nodeOf } from "./chart";
import { COL_GAP, NODE_W, boundsOf } from "./layout";

const MINIMAP_STRIP = 250;
/** Matches the CSS breakpoint that hides `.react-flow__minimap`. */
const MINIMAP_HIDDEN_AT = 699;
const PAD = 16;
const PHONE_TOP = 12;
const PHONE_BOTTOM = 36;
const PHONE_EDGE = 6;
const LABEL_ABOVE = 48;
/** Axis words end this far to the right of the house frames, in flow units. */
const LABEL_REACH = 80;
const DESK_LABEL = 52;

function hideSlicedColumn(viewLeft: number): number {
  const pitch = NODE_W + COL_GAP;
  const into = ((viewLeft % pitch) + pitch) % pitch;
  if (into <= NODE_W) return viewLeft + (NODE_W - into) + 12;
  return viewLeft;
}

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

export function openingViewport(
  width: number,
  height: number,
  viewportWidth = width,
): { x: number; y: number; zoom: number } {
  if (width < 1 || height < 1) {
    return { x: 0, y: 0, zoom: 1 };
  }
  const scene = alliances();
  const span = Math.max(scene.bottom - scene.top, 1);
  const columnCenter = (scene.left + scene.right) / 2;

  if (viewportWidth > MINIMAP_HIDDEN_AT) {
    let zoom = Math.min(1.35, Math.max(height - 2 * PAD, 1) / span);
    const focusWidth = scene.right - scene.left + DESK_LABEL;
    if (focusWidth * zoom > width - 2 * PAD) zoom = (width - 2 * PAD) / focusWidth;
    const viewRight = scene.right + DESK_LABEL + MINIMAP_STRIP / zoom;
    const viewLeft = hideSlicedColumn(viewRight - width / zoom);
    return { x: -viewLeft * zoom, y: PAD - scene.top * zoom, zoom };
  }

  let zoom = Math.min(1.35, Math.max(height - PHONE_TOP - PHONE_BOTTOM, 1) / span);
  const reach = Math.max(columnCenter - scene.left, scene.right + LABEL_REACH - columnCenter, 1);
  if (width > PHONE_EDGE * 2) zoom = Math.min(zoom, (width / 2 - PHONE_EDGE) / reach);
  const extra = height - span * zoom;
  const top = Math.max(PHONE_TOP, (extra - (PHONE_BOTTOM - PHONE_TOP)) / 2);
  const viewLeft = columnCenter - width / (2 * zoom);
  return { x: -viewLeft * zoom, y: top - scene.top * zoom, zoom };
}
