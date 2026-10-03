import { NODES } from "./chart";
import { AXIS_W, AXIS_X, FRAME_PAD, LAYER_COUNT, MAP_W, NODE_H, NODE_W, colX, rowY } from "./layout";

const MOBILE_WIDTH = 700;
const MINIMAP_STRIP = 250;
const OPENING_TOP = -84;
const OPENING_PAD = 16;
const COLUMN_CLEARANCE = 28;

function axisFar(): number {
  return MAP_W + 40 + AXIS_W;
}

function openingBottom(): number {
  const rows = NODES.map((node) => rowY(node.row));
  return Math.max(...rows) + NODE_H + FRAME_PAD;
}

function openingZoom(height: number): number {
  const span = openingBottom() - OPENING_TOP;
  const fit = (height - 2 * OPENING_PAD) / span;
  return Math.min(1.25, Math.max(0.35, fit));
}

function bands(): Array<{ left: number; right: number }> {
  const layers = [...new Set(NODES.map((node) => node.layer))].sort((a, b) => a - b);
  return [
    { left: AXIS_X, right: AXIS_X + AXIS_W },
    ...layers.map((layer) => ({ left: colX(layer), right: colX(layer) + NODE_W })),
  ];
}

export function openingViewport(width: number, height: number): { x: number; y: number; zoom: number } {
  if (width < 1 || height < 1) {
    return { x: 0, y: 0, zoom: 1 };
  }
  let zoom = openingZoom(height);
  const gutter = width < MOBILE_WIDTH ? OPENING_PAD : MINIMAP_STRIP;
  let viewLeft = axisFar() + gutter / zoom - width / zoom;
  const cut = bands().find((band) => band.left < viewLeft && viewLeft < band.right);
  if (cut) {
    const pushed = cut.right + COLUMN_CLEARANCE;
    const axisScreen = (axisFar() - pushed) * zoom;
    const axisFits = axisScreen >= OPENING_PAD && axisScreen <= width - OPENING_PAD;
    const housesStay = pushed <= colX(LAYER_COUNT - 1);
    if (housesStay && axisFits) {
      viewLeft = pushed;
    } else {
      const sceneLeft = cut.left - COLUMN_CLEARANCE;
      zoom = Math.min(zoom, (width - 2 * OPENING_PAD) / (axisFar() - sceneLeft));
      viewLeft = sceneLeft;
    }
  }
  return { x: -viewLeft * zoom, y: OPENING_PAD - OPENING_TOP * zoom, zoom };
}
