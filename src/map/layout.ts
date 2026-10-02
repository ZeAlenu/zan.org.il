import type { ChartNode } from "./chart";

export const NODE_W = 196;
export const NODE_H = 62;
export const COL_GAP = 120;
export const ROW_PITCH = 86;
export const ROW_COUNT = 10;
export const LAYER_COUNT = 12;
export const RIDGE_ROW = 6;
export const FRAME_PAD = 14;

export function colX(layer: number): number {
  return layer * (NODE_W + COL_GAP);
}

export function rowY(row: number): number {
  return row * ROW_PITCH;
}

export const MAP_W = colX(LAYER_COUNT - 1) + NODE_W;
export const MAP_H = rowY(ROW_COUNT - 1) + NODE_H;
export const RIDGE_Y = rowY(RIDGE_ROW) + NODE_H / 2;

export const AXIS_X = -170;
export const AXIS_W = 130;
export const BAND_TOP = -36;
export const BAND_BOTTOM = MAP_H + 28;
export const BAND_RIGHT = MAP_W + 48;

export function boundsOf(nodes: ChartNode[]): { x: number; y: number; w: number; h: number } {
  const left = Math.min(...nodes.map((node) => colX(node.layer))) - FRAME_PAD;
  const top = Math.min(...nodes.map((node) => rowY(node.row))) - FRAME_PAD;
  const right = Math.max(...nodes.map((node) => colX(node.layer) + NODE_W)) + FRAME_PAD;
  const bottom = Math.max(...nodes.map((node) => rowY(node.row) + NODE_H)) + FRAME_PAD;
  return { x: left, y: top, w: right - left, h: bottom - top };
}
