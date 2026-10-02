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
  page: "#f4f6f8",
  panel: "#ffffff",
  box: "#ffffff",
  root: "#e7edf6",
  text: "#0e1d55",
  text2: "#24356f",
  text3: "#3d4e86",
  line: "#d3dced",
  white: "#ffffff",
  COL: "#c63a4a",
  LIB: "#0f7892",
  MIX: "#9a7300",
  ISL: "#0f7d52",
  JEW: "#1f5fa6",
};
