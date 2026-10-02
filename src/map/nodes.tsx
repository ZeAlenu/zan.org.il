import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { FRAMES, NODES, nodeOf, type ChartNode, type Frame } from "./chart";
import { AXIS_W, AXIS_X, BAND_TOP, MAP_W, NODE_H, NODE_W, RIDGE_Y, boundsOf, colX, rowY } from "./layout";
import type { Palette } from "./theme";

export type IdeaData = {
  spec: ChartNode;
  palette: Palette;
  dimmed: boolean;
  selected: boolean;
};

export type FrameData = {
  frame: Frame;
  palette: Palette;
  dimmed: boolean;
  labelCenter: number;
};

export type HeaderData = { label: string; width: number; palette: Palette };

export type AxisData = { palette: Palette };

export type IdeaNode = Node<IdeaData, "idea">;
export type FrameNode = Node<FrameData, "frame">;
export type HeaderNode = Node<HeaderData, "header">;
export type AxisNode = Node<AxisData, "axis">;

const HIDDEN_HANDLE = { opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1, border: 0 };

export function IdeaBox({ data }: NodeProps<IdeaNode>) {
  const { spec, palette, dimmed, selected } = data;
  const stroke = spec.ink ? palette[spec.ink] : palette[spec.attr];
  return (
    <div
      className="idea"
      title={`${spec.title} — ${spec.subtitle}`}
      style={{
        width: NODE_W,
        height: NODE_H,
        background: spec.root ? palette.root : palette.box,
        borderColor: stroke,
        borderWidth: selected ? 2.5 : spec.root ? 2 : 1.5,
        opacity: dimmed ? 0.22 : 1,
      }}
    >
      <div className="idea-short" style={{ color: palette.text }}>
        {spec.short}
      </div>
      <div className="idea-tag" style={{ color: palette.text2 }}>
        {spec.tag}
      </div>
      <Handle type="target" position={Position.Left} id="l" style={HIDDEN_HANDLE} />
      <Handle type="source" position={Position.Right} id="r" style={HIDDEN_HANDLE} />
      <Handle type="source" position={Position.Top} id="t-s" style={HIDDEN_HANDLE} />
      <Handle type="target" position={Position.Top} id="t-t" style={HIDDEN_HANDLE} />
      <Handle type="source" position={Position.Bottom} id="b-s" style={HIDDEN_HANDLE} />
      <Handle type="target" position={Position.Bottom} id="b-t" style={HIDDEN_HANDLE} />
    </div>
  );
}

function frameBackground(frame: Frame, palette: Palette): string | undefined {
  switch (frame.look) {
    case "redGreen":
      return `linear-gradient(to top right, ${palette.COL}38 50%, ${palette.ISL}38 50%)`;
    case "liberty":
      return [
        `linear-gradient(to top right, transparent 50%, ${palette.JEW}40 50%)`,
        `linear-gradient(to top right, transparent 50%, ${palette.page} 50%)`,
        `repeating-linear-gradient(to bottom, ${palette.COL}4d 0 12px, ${palette.white}26 12px 24px)`,
      ].join(", ");
    case "exile":
      return undefined;
    default: {
      const unreachable: never = frame.look;
      return unreachable;
    }
  }
}

function frameMarks(frame: Frame): string[] | null {
  switch (frame.look) {
    case "liberty":
      return ["🇮🇱", "🇺🇸"];
    case "redGreen":
      return ["🍉"];
    case "exile":
      return null;
    default: {
      const unreachable: never = frame.look;
      return unreachable;
    }
  }
}

export function FrameBox({ data, width, height }: NodeProps<FrameNode>) {
  const { frame, palette, dimmed, labelCenter } = data;
  const background = frameBackground(frame, palette);
  const marks = frameMarks(frame);
  return (
    <div
      className={`frame frame-${frame.look}${dimmed ? " is-dimmed" : ""}`}
      title={`${frame.label}. ${frame.tooltip}`}
      style={{ width, height, background }}
    >
      <div className="frame-label" style={{ left: labelCenter }}>
        {marks ? (
          <span className="frame-label-marks" aria-hidden="true">
            {marks.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </span>
        ) : null}
        {frame.label}
      </div>
    </div>
  );
}

export function LayerHeader({ data }: NodeProps<HeaderNode>) {
  return (
    <div className="header" style={{ width: data.width, color: data.palette.text3, borderColor: data.palette.line }}>
      {data.label}
    </div>
  );
}

const RIGHT_AXIS_X = MAP_W + 40;

function ridgePieces(): Array<{ left: number; width: number }> {
  const gap = 8;
  const ridgeEnd = RIGHT_AXIS_X + AXIS_W / 2;
  const occupied = NODES.filter((node) => {
    const top = rowY(node.row);
    return RIDGE_Y >= top && RIDGE_Y <= top + NODE_H;
  })
    .map((node) => colX(node.layer))
    .sort((a, b) => a - b);
  const pieces: Array<{ left: number; width: number }> = [];
  let cursor = AXIS_X + AXIS_W / 2;
  for (const left of occupied) {
    if (left - gap > cursor) {
      pieces.push({ left: cursor - AXIS_X, width: left - gap - cursor });
    }
    cursor = Math.max(cursor, left + NODE_W + gap);
  }
  if (cursor < ridgeEnd) {
    pieces.push({ left: cursor - AXIS_X, width: ridgeEnd - cursor });
  }
  return pieces.flatMap((piece) => openForLibertyLabel(piece));
}

const LIBERTY_LABEL_HALF = 77;
const LABEL_LINE_GAP = 2;

function openForLibertyLabel(piece: { left: number; width: number }): Array<{ left: number; width: number }> {
  const frame = FRAMES.find((item) => item.look === "liberty");
  if (!frame) return [piece];
  const box = boundsOf(frame.members.map(nodeOf));
  const center = box.x + box.w / 2 + 1.5;
  const spanLeft = center - LIBERTY_LABEL_HALF - LABEL_LINE_GAP - AXIS_X;
  const spanRight = center + LIBERTY_LABEL_HALF + LABEL_LINE_GAP - AXIS_X;
  const start = piece.left;
  const end = piece.left + piece.width;
  if (end <= spanLeft || start >= spanRight) return [piece];
  const parts: Array<{ left: number; width: number }> = [];
  if (start < spanLeft) parts.push({ left: start, width: spanLeft - start });
  if (end > spanRight) parts.push({ left: spanRight, width: end - spanRight });
  return parts;
}

function AxisLabels({ palette }: { palette: Palette }) {
  return (
    <>
      <div className="axis-label" style={{ color: palette.COL }}>
        <span className="axis-arrow">▲</span>
        קולקטיביזם
      </div>
      <div className="axis-label" style={{ color: palette.LIB }}>
        אינדיבידואליזם
        <span className="axis-arrow">▼</span>
      </div>
    </>
  );
}

export function Axis({ data, width, height }: NodeProps<AxisNode>) {
  const { palette } = data;
  const ridgeTop = RIDGE_Y - BAND_TOP;
  return (
    <div className="axis" style={{ width, height }}>
      {ridgePieces().map((piece) => (
        <div
          key={piece.left}
          className="ridge-line"
          style={{ top: ridgeTop, left: piece.left, width: piece.width, borderColor: palette.text3 }}
        />
      ))}
      <div className="axis-col" style={{ width: AXIS_W }}>
        <div className="axis-pair" style={{ top: ridgeTop }}>
          <AxisLabels palette={palette} />
        </div>
      </div>
      <div className="axis-col" style={{ width: AXIS_W, left: RIGHT_AXIS_X - AXIS_X }}>
        <div className="axis-pair" style={{ top: ridgeTop }}>
          <AxisLabels palette={palette} />
        </div>
      </div>
    </div>
  );
}

export const nodeTypes = {
  idea: IdeaBox,
  frame: FrameBox,
  header: LayerHeader,
  axis: Axis,
};
