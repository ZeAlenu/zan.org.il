type Viewport = { x: number; y: number; zoom: number };

type Camera = {
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
};

type SmoothPanOptions = {
  gain?: number;
  minZoom: number;
  maxZoom: number;
  onUserMove: (viewport: Viewport) => void;
};

const DEFAULT_GAIN = 1.2;
const MAX_SPEED = 5200;
const IMPULSE = 1000 / 48;
const FRICTION_MS = 240;
const STOP_SPEED = 12;

function reduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wheelFactor(event: WheelEvent): number {
  return event.deltaMode === 1 ? 20 : 1;
}

export function createSmoothPan(options: SmoothPanOptions) {
  const gain = options.gain ?? DEFAULT_GAIN;
  let camera: Camera | null = null;
  let pane: HTMLElement | null = null;
  let live: Viewport | null = null;
  let vx = 0;
  let vy = 0;
  let frame = 0;
  let lastTime = 0;

  function bind(next: Camera, host: HTMLElement) {
    camera = next;
    pane = host;
  }

  function syncLive(): Viewport | null {
    if (!camera) return null;
    if (!live) live = camera.getViewport();
    return live;
  }

  function stop() {
    vx = 0;
    vy = 0;
    live = null;
    lastTime = 0;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function write(next: Viewport) {
    live = next;
    options.onUserMove(next);
    camera?.setViewport(next);
  }

  function apply(dx: number, dy: number) {
    const base = syncLive();
    if (!base || (dx === 0 && dy === 0)) return;
    write({
      x: base.x + dx,
      y: base.y + dy,
      zoom: base.zoom,
    });
  }

  function capSpeed() {
    const speed = Math.hypot(vx, vy);
    if (speed <= MAX_SPEED) return;
    const scale = MAX_SPEED / speed;
    vx *= scale;
    vy *= scale;
  }

  function tick(now: number) {
    const dt = lastTime ? Math.min(64, now - lastTime) : 16;
    lastTime = now;
    if (reduceMotion()) {
      apply((vx * dt) / 1000, (vy * dt) / 1000);
      stop();
      return;
    }
    apply((vx * dt) / 1000, (vy * dt) / 1000);
    const decay = Math.exp(-dt / FRICTION_MS);
    vx *= decay;
    vy *= decay;
    if (Math.hypot(vx, vy) < STOP_SPEED) {
      frame = 0;
      lastTime = 0;
      live = null;
      vx = 0;
      vy = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function kick() {
    if (!frame) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function nudge(dx: number, dy: number) {
    if (!camera) return;
    if (reduceMotion()) {
      live = null;
      apply(dx, dy);
      live = null;
      return;
    }
    syncLive();
    vx += dx * IMPULSE;
    vy += dy * IMPULSE;
    capSpeed();
    kick();
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const current = camera;
    const host = pane;
    if (!current || !host) return;
    stop();
    const viewport = current.getViewport();
    const nextZoom = Math.min(options.maxZoom, Math.max(options.minZoom, viewport.zoom * factor));
    if (nextZoom === viewport.zoom) return;
    const rect = host.getBoundingClientRect();
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    const flowX = (pointX - viewport.x) / viewport.zoom;
    const flowY = (pointY - viewport.y) / viewport.zoom;
    write({
      x: pointX - flowX * nextZoom,
      y: pointY - flowY * nextZoom,
      zoom: nextZoom,
    });
    live = null;
  }

  function onWheel(event: WheelEvent) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(".nowheel")) return;

    // Trackpad pinch — keep zoom under the pointer.
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      const factor = Math.pow(2, -event.deltaY * 0.01);
      zoomAt(event.clientX, event.clientY, factor);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
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
