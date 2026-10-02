import type { EdgeColor } from "./chart";

export type Palette = Record<EdgeColor, string> & {
  page: string;
  panel: string;
  box: string;
  root: string;
  text: string;
  text2: string;
  text3: string;
  line: string;
  white: string;
};

export const palette: Palette = {
  page: "#f7f7f5",
  panel: "#ffffff",
  box: "#ffffff",
  root: "#eef0f3",
  text: "#15171b",
  text2: "#4a4f58",
  text3: "#7a808a",
  line: "#d5d8de",
  white: "#ffffff",
  COL: "#c63a4a",
  LIB: "#0f7892",
  MIX: "#9a7300",
  ISL: "#0f7d52",
  JEW: "#1f5fa6",
};
