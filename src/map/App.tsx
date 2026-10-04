import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useStore,
  useViewport,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  EDGES,
  FRAMES,
  LAYER_GROUPS,
  NODES,
  attrWord,
  kindLabel,
  nodeOf,
  type ChartEdge,
  type Kind,
} from "./chart";
import {
  AXIS_W,
  AXIS_X,
  BAND_BOTTOM,
  BAND_TOP,
  boundsOf,
  colX,
  MAP_W,
  NODE_H,
  NODE_W,
  rowY,
} from "./layout";
import { nodeTypes } from "./nodes";
import { openingViewport } from "./opening";
import { createSmoothPan } from "./smoothPan";
import { palette, type Palette } from "./theme";

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;

type Viewport = { x: number; y: number; zoom: number };

type FlowCamera = {
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport, options?: { duration: number }) => void;
};

const ARROW_PAN = 48;
const ARROW_PAN_FAST = 144;

function arrowPan(key: string): { dx: number; dy: number } | null {
  switch (key) {
    case "ArrowLeft":
      return { dx: 1, dy: 0 };
    case "ArrowRight":
      return { dx: -1, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: 1 };
    case "ArrowDown":
      return { dx: 0, dy: -1 };
    default:
      return null;
  }
}

function typingInField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

type OpeningSession = {
  placing: { current: boolean };
  placed: { current: Viewport | null };
};

function sameView(a: Viewport, b: Viewport): boolean {
  return Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.zoom - b.zoom) < 0.01;
}

function visibleStage(): { width: number; height: number; offsetY: number } | null {
  const stage = document.querySelector(".stage");
  if (!(stage instanceof HTMLElement)) return null;
  const rect = stage.getBoundingClientRect();
  const view = window.visualViewport;
  const viewTop = view?.offsetTop ?? 0;
  const viewLeft = view?.offsetLeft ?? 0;
  const viewHeight = view?.height ?? window.innerHeight;
  const viewWidth = view?.width ?? window.innerWidth;
  const top = Math.max(rect.top, viewTop);
  const bottom = Math.min(rect.bottom, viewTop + viewHeight);
  const left = Math.max(rect.left, viewLeft);
  const right = Math.min(rect.right, viewLeft + viewWidth);
  const width = right - left;
  const height = bottom - top;
  if (width < 1 || height < 1) return null;
  return { width, height, offsetY: top - rect.top };
}

function placeOpening(camera: FlowCamera, session: OpeningSession) {
  const frame = visibleStage();
  if (!frame) return;
  const next = openingViewport(frame.width, frame.height, window.innerWidth);
  const viewport = { x: next.x, y: next.y + frame.offsetY, zoom: next.zoom };
  session.placing.current = true;
  camera.setViewport(viewport, { duration: 0 });
  session.placing.current = false;
  session.placed.current = viewport;
}

function strokeFor(kind: Kind): { width: number; opacity: number; dash?: string } {
  switch (kind) {
    case "pipe":
      return { width: 3, opacity: 1 };
    case "stem":
      return { width: 2.4, opacity: 0.95 };
    case "fracture":
      return { width: 2, opacity: 1, dash: "8 5" };
    case "feed":
      return { width: 1.7, opacity: 0.85, dash: "4 4" };
    case "weak":
      return { width: 1.3, opacity: 0.6, dash: "2 4" };
    case "flow":
      return { width: 1.5, opacity: 0.6 };
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function ledTo(focusId: string | null): Set<string> | null {
  if (!focusId) {
    return null;
  }
  const incoming = new Map<string, string[]>();
  for (const edge of EDGES) {
    const sources = incoming.get(edge.to);
    if (sources) {
      sources.push(edge.from);
    } else {
      incoming.set(edge.to, [edge.from]);
    }
  }
  const ids = new Set<string>();
  const stack = [focusId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || ids.has(id)) {
      continue;
    }
    ids.add(id);
    const sources = incoming.get(id);
    if (sources) {
      for (const source of sources) {
        stack.push(source);
      }
    }
  }
  return ids;
}

function handlesFor(edge: ChartEdge): { sourceHandle: string; targetHandle: string } {
  const source = nodeOf(edge.from);
  const target = nodeOf(edge.to);
  if (source.layer !== target.layer) {
    return { sourceHandle: "r", targetHandle: "l" };
  }
  return target.row < source.row
    ? { sourceHandle: "t-s", targetHandle: "b-t" }
    : { sourceHandle: "b-s", targetHandle: "t-t" };
}

function buildNodes(palette: Palette, lit: Set<string> | null, selectedId: string | null): Node[] {
  const out: Node[] = [];
  for (const group of LAYER_GROUPS) {
    const x = colX(group.from);
    out.push({
      id: `header-${group.label}`,
      type: "header",
      position: { x, y: -64 },
      data: { label: group.label, width: colX(group.to) + NODE_W - x, palette },
      selectable: false,
      draggable: false,
      focusable: false,
    });
  }
  out.push({
    id: "axis",
    type: "axis",
    position: { x: AXIS_X, y: BAND_TOP },
    width: MAP_W + 40 + AXIS_W - AXIS_X,
    height: BAND_BOTTOM - BAND_TOP,
    data: { palette },
    selectable: false,
    draggable: false,
    focusable: false,
    zIndex: -2,
  });
  for (const frame of FRAMES) {
    const members = frame.members.map(nodeOf);
    const box = boundsOf(members);
    const labelCenter = frame.labelOver ? colX(nodeOf(frame.labelOver).layer) + NODE_W / 2 - box.x : box.w / 2;
    out.push({
      id: frame.id,
      type: "frame",
      position: { x: box.x, y: box.y },
      width: box.w,
      height: box.h,
      data: {
        frame,
        palette,
        dimmed: lit !== null && !frame.members.some((id) => lit.has(id)),
        labelCenter,
      },
      selectable: false,
      draggable: false,
      focusable: false,
      zIndex: -1,
    });
  }
  for (const spec of NODES) {
    out.push({
      id: spec.id,
      type: "idea",
      position: { x: colX(spec.layer), y: rowY(spec.row) },
      width: NODE_W,
      height: NODE_H,
      data: { spec, palette, dimmed: lit !== null && !lit.has(spec.id), selected: selectedId === spec.id },
      draggable: false,
      ariaLabel: `${spec.title}. ${spec.subtitle}`,
    });
  }
  return out;
}

function buildEdges(palette: Palette, path: Set<string> | null): Edge[] {
  return EDGES.map((edge) => {
    const base = strokeFor(edge.kind);
    const touches = path === null || (path.has(edge.from) && path.has(edge.to));
    let opacity = edge.emphasis ? Math.min(1, base.opacity + 0.2) : base.opacity;
    let width = edge.emphasis ? base.width + 0.4 : base.width;
    if (path !== null) {
      opacity = touches ? 1 : 0.06;
      width = touches ? width + 0.6 : width;
    }
    const color = palette[edge.color];
    return {
      id: `${edge.from}->${edge.to}`,
      source: edge.from,
      target: edge.to,
      ...handlesFor(edge),
      type: "default",
      label: edge.label,
      labelStyle: { fill: color, fontFamily: "Rubik, sans-serif", fontSize: 12, fontWeight: 700 },
      labelBgStyle: { fill: palette.page },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
      style: { stroke: color, strokeWidth: width, strokeDasharray: base.dash, opacity },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      zIndex: touches && path !== null ? 5 : 0,
      focusable: false,
      selectable: false,
    };
  });
}

function ChartMinimap({ path }: { path: Set<string> | null }) {
  const { x, y, zoom } = useViewport();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const visible = useMemo(() => {
    const left = -x / zoom;
    const top = -y / zoom;
    const right = left + width / zoom;
    const bottom = top + height / zoom;
    const ids = new Set<string>();
    for (const node of NODES) {
      const nx = colX(node.layer);
      const ny = rowY(node.row);
      const onScreen = nx + NODE_W >= left && nx <= right && ny + NODE_H >= top && ny <= bottom;
      if (onScreen) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [x, y, zoom, width, height]);

  return (
    <MiniMap
      className="nowheel"
      position="bottom-right"
      pannable
      zoomable
      nodeColor={(node) => {
        if (node.type !== "idea") {
          return "transparent";
        }
        const active = path ? path.has(node.id) : visible.has(node.id);
        if (!active) {
          return palette.line;
        }
        const spec = nodeOf(node.id);
        return spec.ink ? palette[spec.ink] : palette[spec.attr];
      }}
      maskColor={path ? `${palette.page}66` : `${palette.page}b3`}
      style={{ background: palette.panel }}
    />
  );
}

function Legend({ palette }: { palette: Palette }) {
  const colors: Array<[keyof Palette, string]> = [
    ["COL", "דפוס המגדל / קולקטיב"],
    ["LIB", "חירות"],
    ["MIX", "מעורב"],
    ["ISL", "ענף האסלאם"],
    ["JEW", "יהדות ← ציונות ← ישראל"],
  ];
  const lines: Array<[Kind, string]> = [
    ["stem", "שושלת ישירה"],
    ["flow", "השפעה"],
    ["feed", "הזנה, לא זהות"],
    ["weak", "חלש"],
    ["fracture", "פולמוס / שבר"],
  ];
  return (
    <div className="legend">
      <div className="legend-row">
        {colors.map(([key, label]) => (
          <span key={key} className="legend-item">
            <i className="dot" style={{ background: palette[key] }} />
            {label}
          </span>
        ))}
      </div>
      <div className="legend-row">
        {lines.map(([kind, label]) => {
          const stroke = strokeFor(kind);
          return (
            <span key={kind} className="legend-item">
              <svg width="30" height="10" aria-hidden="true">
                <line
                  x1="2"
                  y1="5"
                  x2="28"
                  y2="5"
                  stroke={palette.text2}
                  strokeWidth={stroke.width}
                  strokeDasharray={stroke.dash}
                />
              </svg>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ id, palette, onClose }: { id: string; palette: Palette; onClose: () => void }) {
  const node = nodeOf(id);
  const incoming = EDGES.filter((edge) => edge.to === id);
  const outgoing = EDGES.filter((edge) => edge.from === id);
  const stroke = node.ink ? palette[node.ink] : palette[node.attr];
  return (
    <aside className="detail nowheel" style={{ background: palette.panel, borderColor: palette.line, color: palette.text }}>
      <div className="detail-top" style={{ borderColor: stroke }}>
        <div>
          <div className="detail-tag" style={{ color: stroke }}>
            {node.tag}
          </div>
          <h2>{node.title}</h2>
        </div>
        <button type="button" className="close" onClick={onClose} aria-label="סגירה" style={{ color: palette.text2 }}>
          ✕
        </button>
      </div>
      <p className="detail-sub">{node.subtitle}</p>
      <p className="detail-note" style={{ color: palette.text2 }}>
        {node.note}
      </p>
      <p className="detail-meta" style={{ color: palette.text3 }}>
        מאפיין: {attrWord(node.attr)}
      </p>
      <h3>נכנס</h3>
      {incoming.length === 0 ? (
        <p className="detail-meta" style={{ color: palette.text3 }}>
          שורש. אין כניסה.
        </p>
      ) : (
        <ul>
          {incoming.map((edge) => (
            <li key={edge.from} style={{ color: palette.text2 }}>
              <i className="dot" style={{ background: palette[edge.color] }} />
              {nodeOf(edge.from).title} · {kindLabel(edge.kind)}
            </li>
          ))}
        </ul>
      )}
      <h3>יוצא</h3>
      {outgoing.length === 0 ? (
        <p className="detail-meta" style={{ color: palette.text3 }}>
          אין המשך על המפה.
        </p>
      ) : (
        <ul>
          {outgoing.map((edge) => (
            <li key={edge.to} style={{ color: palette.text2 }}>
              <i className="dot" style={{ background: palette[edge.color] }} />
              {nodeOf(edge.to).title} · {kindLabel(edge.kind)}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const focusId = hoverId ?? selectedId;
  const lit = useMemo(() => ledTo(focusId), [focusId]);
  const nodes = useMemo(() => buildNodes(palette, lit, selectedId), [lit, selectedId]);
  const edges = useMemo(() => buildEdges(palette, lit), [lit]);
  const camera = useRef<FlowCamera | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const userMoved = useRef(false);
  const placing = useRef(false);
  const placed = useRef<Viewport | null>(null);
  const session = { placing, placed };
  const noteUserMove = (viewport: Viewport) => {
    if (placing.current || userMoved.current) return;
    const origin = placed.current;
    if (origin && !sameView(origin, viewport)) userMoved.current = true;
  };
  const smoothPan = useMemo(
    () =>
      createSmoothPan({
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        onUserMove: noteUserMove,
      }),
    [],
  );

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      if (userMoved.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = camera.current;
        if (current && !userMoved.current) placeOpening(current, session);
      });
    };
    let cancelled = false;
    apply();
    const stage = stageRef.current;
    const observer = new ResizeObserver(apply);
    if (stage) observer.observe(stage);
    const view = window.visualViewport;
    view?.addEventListener("resize", apply);
    view?.addEventListener("scroll", apply);
    document.fonts.ready.then(() => {
      if (!cancelled) apply();
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      view?.removeEventListener("resize", apply);
      view?.removeEventListener("scroll", apply);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.addEventListener("wheel", smoothPan.onWheel, { passive: false, capture: true });
    return () => {
      stage.removeEventListener("wheel", smoothPan.onWheel, true);
      smoothPan.stop();
    };
  }, [smoothPan]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (typingInField(event.target)) return;
      const direction = arrowPan(event.key);
      if (!direction) return;
      if (!camera.current) return;
      event.preventDefault();
      const step = event.shiftKey ? ARROW_PAN_FAST : ARROW_PAN;
      smoothPan.nudge(direction.dx * step, direction.dy * step);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [smoothPan]);

  return (
    <div className="app">
      <main className="stage" ref={stageRef}>
        <details className="map-key" style={{ color: palette.text }}>
          <summary aria-label="מקרא">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="1.6" cy="2" r="1.3" fill="currentColor" />
              <circle cx="1.6" cy="6" r="1.3" fill="currentColor" />
              <circle cx="1.6" cy="10" r="1.3" fill="currentColor" />
              <path d="M4.4 2h6.2M4.4 6h6.2M4.4 10h6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </summary>
          <Legend palette={palette} />
        </details>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode="light"
          onInit={(instance) => {
            camera.current = instance;
            const host = stageRef.current?.querySelector(".react-flow") ?? stageRef.current;
            if (host instanceof HTMLElement) smoothPan.bind(instance, host);
            if (!userMoved.current) placeOpening(instance, session);
          }}
          onMoveStart={(event, viewport) => {
            const kind = event?.type;
            if (kind === "mousedown" || kind === "touchstart" || kind === "pointerdown") {
              smoothPan.stop();
            }
            noteUserMove(viewport);
          }}
          onMove={(_event, viewport) => noteUserMove(viewport)}
          onMoveEnd={(_event, viewport) => noteUserMove(viewport)}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => {
            if (node.type !== "idea") return;
            setSelectedId((current) => (current === node.id ? null : node.id));
          }}
          onNodeMouseEnter={(_, node) => {
            if (node.type === "idea") setHoverId(node.id);
          }}
          onNodeMouseLeave={() => setHoverId(null)}
          onPaneClick={() => setSelectedId(null)}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.15} color="#c5d0e4" />
          <Controls className="nowheel nopan" showInteractive={false} position="bottom-left" />
          <ChartMinimap path={lit} />
        </ReactFlow>
        {selectedId ? <Detail id={selectedId} palette={palette} onClose={() => setSelectedId(null)} /> : null}
      </main>
    </div>
  );
}
