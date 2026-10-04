type Viewport = { x: number; y: number; zoom: number };

type Camera = {
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
};

type SmoothPanOptions = {
  gain?: number;
  smoothMs?: number;
  minZoom: number;
  maxZoom: number;
  onUserMove: (viewport: Viewport) => void;
};

const DEFAULT_GAIN = 0.85;
const DEFAULT_SMOOTH_MS = 140;
const STOP = 0.05;

function reduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wheelFactor(event: WheelEvent): number {
  return event.deltaMode === 1 ? 20 : 1;
}

export function createSmoothPan(options: SmoothPanOptions) {
  const gain = options.gain ?? DEFAULT_GAIN;
  const smoothMs = options.smoothMs ?? DEFAULT_SMOOTH_MS;
  let camera: Camera | null = null;
  let pane: HTMLElement | null = null;
  let pendingX = 0;
  let pendingY = 0;
  let frame = 0;
  let lastTime = 0;

  function bind(next: Camera, host: HTMLElement) {
    camera = next;
    pane = host;
  }

  function stop() {
    pendingX = 0;
    pendingY = 0;
    lastTime = 0;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function apply(dx: number, dy: number) {
    const current = camera;
    if (!current || (dx === 0 && dy === 0)) return;
    const viewport = current.getViewport();
    const next = {
      x: viewport.x + dx,
      y: viewport.y + dy,
      zoom: viewport.zoom,
    };
    options.onUserMove(next);
    current.setViewport(next);
  }

  function tick(now: number) {
    const dt = lastTime ? Math.min(64, now - lastTime) : 16;
    lastTime = now;
    const alpha = reduceMotion() ? 1 : 1 - Math.exp(-dt / smoothMs);
    const stepX = pendingX * alpha;
    const stepY = pendingY * alpha;
    pendingX -= stepX;
    pendingY -= stepY;
    if (Math.abs(pendingX) < STOP) pendingX = 0;
    if (Math.abs(pendingY) < STOP) pendingY = 0;
    apply(stepX, stepY);
    if (pendingX !== 0 || pendingY !== 0) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0;
      lastTime = 0;
    }
  }

  function kick() {
    if (!frame) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function nudge(dx: number, dy: number) {
    if (reduceMotion()) {
      apply(dx, dy);
      return;
    }
    pendingX += dx;
    pendingY += dy;
    kick();
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const current = camera;
    const host = pane;
    if (!current || !host) return;
    const viewport = current.getViewport();
    const nextZoom = Math.min(options.maxZoom, Math.max(options.minZoom, viewport.zoom * factor));
    if (nextZoom === viewport.zoom) return;
    const rect = host.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    const flowX = (pointX - viewport.x) / viewport.zoom;
    const flowY = (pointY - viewport.y) / viewport.zoom;
    const next = {
      x: pointX - flowX * nextZoom,
      y: pointY - flowY * nextZoom,
      zoom: nextZoom,
    };
    options.onUserMove(next);
    current.setViewport(next);
  }

  function onWheel(event: WheelEvent) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(".nowheel")) return;
    if (!pane?.contains(event.target)) return;

    // Trackpad pinch — keep zoom under the pointer.
    if (event.ctrlKey) {
      event.preventDefault();
      stop();
      const factor = Math.pow(2, -event.deltaY * 0.01);
      zoomAt(event.clientX, event.clientY, factor);
      return;
    }

    event.preventDefault();
    const normalize = wheelFactor(event);
    let deltaX = event.deltaX * normalize;
    let deltaY = event.deltaY * normalize;
    if (event.shiftKey && deltaX === 0) {
      deltaX = deltaY;
      deltaY = 0;
    }
    nudge(-deltaX * gain, -deltaY * gain);
  }

  return { bind, stop, nudge, onWheel };
}
