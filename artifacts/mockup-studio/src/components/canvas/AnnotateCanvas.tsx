import { useRef, useEffect, useCallback, useState } from 'react';
import { useApp } from '../../store';
import paletteIcon from '@assets/image_1775735507491.png';

type Point = { x: number; y: number };

interface FreeStroke {
  id: string;
  kind: 'free';
  tool: 'pen' | 'marker' | 'eraser';
  color: string;
  lineWidth: number;
  opacity: number;
  points: Point[];
}

interface ShapeStroke {
  id: string;
  kind: 'shape';
  tool: 'arrow' | 'rect';
  color: string;
  lineWidth: number;
  opacity?: number;
  start: Point;
  end: Point;
}

interface TextStroke {
  id: string;
  kind: 'text';
  color: string;
  fontSize: number;
  opacity?: number;
  text: string;
  position: Point;
}

type AnyStroke = FreeStroke | ShapeStroke | TextStroke;

interface BBox { x: number; y: number; w: number; h: number }

const SIZE_MAP: Record<string, number> = { S: 2, M: 5, L: 10, XL: 18 };
const FONT_SIZE_MAP: Record<string, number> = { S: 14, M: 20, L: 28, XL: 40 };
const MARKER_ALPHA = 0.45;
const HANDLE_RADIUS = 8;
const HANDLE_COLOR = '#1abc9c';
const HANDLE_NAMES = ['NW','N','NE','W','E','SW','S','SE'] as const;
type HandleName = typeof HANDLE_NAMES[number];

function uid(): string {
  return crypto.randomUUID();
}

// Shared offscreen canvas for measureText (avoids per-call creation)
let _measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (_measureCtx) return _measureCtx;
  const c = document.createElement('canvas');
  _measureCtx = c.getContext('2d');
  return _measureCtx;
}

function getBBox(s: AnyStroke): BBox {
  if (s.kind === 'free') {
    const xs = s.points.map(p => p.x);
    const ys = s.points.map(p => p.y);
    const pad = s.lineWidth;
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    const x2 = Math.max(...xs) + pad;
    const y2 = Math.max(...ys) + pad;
    return { x, y, w: Math.max(x2 - x, 4), h: Math.max(y2 - y, 4) };
  }
  if (s.kind === 'shape') {
    const pad = s.lineWidth;
    const x = Math.min(s.start.x, s.end.x) - pad;
    const y = Math.min(s.start.y, s.end.y) - pad;
    const x2 = Math.max(s.start.x, s.end.x) + pad;
    const y2 = Math.max(s.start.y, s.end.y) + pad;
    return { x, y, w: Math.max(x2 - x, 4), h: Math.max(y2 - y, 4) };
  }
  // text — use measureText for accurate width
  const ctx = getMeasureCtx();
  let textWidth = s.text.length * s.fontSize * 0.6; // fallback
  if (ctx) {
    ctx.font = `bold ${s.fontSize}px Inter, sans-serif`;
    const m = ctx.measureText(s.text);
    textWidth = m.width;
  }
  const textHeight = s.fontSize * 1.4;
  return { x: s.position.x, y: s.position.y - s.fontSize, w: Math.max(textWidth, 4), h: Math.max(textHeight, 4) };
}

function hitTest(s: AnyStroke, p: Point): boolean {
  const bb = getBBox(s);
  return p.x >= bb.x && p.x <= bb.x + bb.w && p.y >= bb.y && p.y <= bb.y + bb.h;
}

function getHandlePositions(bb: BBox): Record<HandleName, Point> {
  const cx = bb.x + bb.w / 2;
  const cy = bb.y + bb.h / 2;
  const r = bb.x + bb.w;
  const b = bb.y + bb.h;
  return {
    NW: { x: bb.x, y: bb.y },
    N:  { x: cx,   y: bb.y },
    NE: { x: r,    y: bb.y },
    W:  { x: bb.x, y: cy   },
    E:  { x: r,    y: cy   },
    SW: { x: bb.x, y: b    },
    S:  { x: cx,   y: b    },
    SE: { x: r,    y: b    },
  };
}

function translateStroke(s: AnyStroke, dx: number, dy: number): AnyStroke {
  if (s.kind === 'free') {
    return { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
  }
  if (s.kind === 'shape') {
    return { ...s, start: { x: s.start.x + dx, y: s.start.y + dy }, end: { x: s.end.x + dx, y: s.end.y + dy } };
  }
  return { ...s, position: { x: s.position.x + dx, y: s.position.y + dy } };
}

// Resize: use linear bbox transform for all stroke kinds to preserve direction/shape
function resizeStroke(s: AnyStroke, oldBB: BBox, newBB: BBox): AnyStroke {
  const mapX = (x: number) => oldBB.w > 0 ? newBB.x + (x - oldBB.x) * (newBB.w / oldBB.w) : newBB.x;
  const mapY = (y: number) => oldBB.h > 0 ? newBB.y + (y - oldBB.y) * (newBB.h / oldBB.h) : newBB.y;

  if (s.kind === 'free') {
    return { ...s, points: s.points.map(p => ({ x: mapX(p.x), y: mapY(p.y) })) };
  }
  if (s.kind === 'shape') {
    return {
      ...s,
      start: { x: mapX(s.start.x), y: mapY(s.start.y) },
      end:   { x: mapX(s.end.x),   y: mapY(s.end.y)   },
    };
  }
  // text: map position
  return { ...s, position: { x: mapX(s.position.x), y: mapY(s.position.y) } };
}

function applyHandle(handle: HandleName, oldBB: BBox, delta: Point): BBox {
  let { x, y, w, h } = oldBB;
  const MIN = 20;

  if (handle === 'NW') {
    const nx = Math.min(x + delta.x, x + w - MIN);
    const ny = Math.min(y + delta.y, y + h - MIN);
    return { x: nx, y: ny, w: w + (x - nx), h: h + (y - ny) };
  }
  if (handle === 'N') {
    const ny = Math.min(y + delta.y, y + h - MIN);
    return { x, y: ny, w, h: h + (y - ny) };
  }
  if (handle === 'NE') {
    const ny = Math.min(y + delta.y, y + h - MIN);
    return { x, y: ny, w: Math.max(w + delta.x, MIN), h: h + (y - ny) };
  }
  if (handle === 'W') {
    const nx = Math.min(x + delta.x, x + w - MIN);
    return { x: nx, y, w: w + (x - nx), h };
  }
  if (handle === 'E') {
    return { x, y, w: Math.max(w + delta.x, MIN), h };
  }
  if (handle === 'SW') {
    const nx = Math.min(x + delta.x, x + w - MIN);
    return { x: nx, y, w: w + (x - nx), h: Math.max(h + delta.y, MIN) };
  }
  if (handle === 'S') {
    return { x, y, w, h: Math.max(h + delta.y, MIN) };
  }
  // SE
  return { x, y, w: Math.max(w + delta.x, MIN), h: Math.max(h + delta.y, MIN) };
}

function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const headLen = 14;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - Math.PI / 6),
    to.y - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + Math.PI / 6),
    to.y - headLen * Math.sin(angle + Math.PI / 6),
  );
}

function redrawStrokes(ctx: CanvasRenderingContext2D, strokes: AnyStroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const s of strokes) {
    ctx.save();
    if (s.kind === 'free') {
      if (s.points.length < 2) { ctx.restore(); continue; }
      ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = s.opacity;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        const prev = s.points[i - 1];
        const curr = s.points[i];
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
      }
      ctx.stroke();
    } else if (s.kind === 'shape') {
      ctx.globalAlpha = s.opacity ?? 1;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (s.tool === 'arrow') {
        drawArrow(ctx, s.start, s.end);
      } else {
        ctx.roundRect(
          s.start.x, s.start.y,
          s.end.x - s.start.x, s.end.y - s.start.y,
          4,
        );
      }
      ctx.stroke();
    } else if (s.kind === 'text') {
      ctx.globalAlpha = s.opacity ?? 1;
      ctx.fillStyle = s.color;
      ctx.font = `bold ${s.fontSize}px Inter, sans-serif`;
      ctx.fillText(s.text, s.position.x, s.position.y);
    }
    ctx.restore();
  }
}

interface TextInputState {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  color: string;
  fontSize: number;
}

export function AnnotateCanvas() {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<AnyStroke[]>([]);
  const activeRef = useRef<AnyStroke | null>(null);
  const isDrawing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [textInput, setTextInput] = useState<TextInputState | null>(null);
  const [textValue, setTextValue] = useState('');

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Counter used to force re-render of overlay/toolbar after drag/resize updates refs
  const [selectionFrame, setSelectionFrame] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<AnyStroke | null>(null);

  // Drag/resize mode — kept in refs so pointer handlers don't need closure rebinding
  const dragMode = useRef<'move' | 'resize' | null>(null);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const resizeHandle = useRef<HandleName | null>(null);
  const resizeBBoxStart = useRef<BBox | null>(null);

  const lw = SIZE_MAP[state.annotateSize] ?? 5;
  const fontSize = FONT_SIZE_MAP[state.annotateSize] ?? 20;

  // ── Canvas-to-screen coordinate helpers ───────────────────────────
  const getPos = useCallback((e: React.PointerEvent<HTMLElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const getScale = useCallback((): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.width / canvas.getBoundingClientRect().width;
  }, []);

  // Convert canvas coords → container-relative screen coords
  const toScreen = useCallback((cp: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return cp;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    return { x: cp.x * scaleX, y: cp.y * scaleY };
  }, []);

  // ── Resize canvas to match display size ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        const saved = strokesRef.current.slice();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) redrawStrokes(ctx, saved);
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ── Clear when annotateClearKey changes ───────────────────────────
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    strokesRef.current = [];
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    setTextInput(null);
    setTextValue('');
    setSelectedId(null);
  }, [state.annotateClearKey]);

  // ── When switching away from select tool, clear selection ─────────
  useEffect(() => {
    if (state.annotateTool !== 'select') {
      setSelectedId(null);
      setShowContextMenu(false);
    }
  }, [state.annotateTool]);

  // ── Focus the text input when it appears ─────────────────────────
  useEffect(() => {
    if (textInput) requestAnimationFrame(() => inputRef.current?.focus());
  }, [textInput]);

  // ── Context menu: close on outside click ─────────────────────────
  useEffect(() => {
    if (!showContextMenu) return;
    const onDown = (e: PointerEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('pointerdown', onDown, { capture: true });
    return () => document.removeEventListener('pointerdown', onDown, { capture: true });
  }, [showContextMenu]);

  // ── Delete key ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && state.annotateTool === 'select') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        deleteSelected();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  // ── Actions ───────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    setSelectedId(prev => {
      if (!prev) return null;
      strokesRef.current = strokesRef.current.filter(s => s.id !== prev);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redrawStrokes(ctx, strokesRef.current);
      return null;
    });
    setShowContextMenu(false);
  }, []);

  const duplicateSelected = useCallback((offsetPx = 16) => {
    setSelectedId(prev => {
      if (!prev) return prev;
      const orig = strokesRef.current.find(s => s.id === prev);
      if (!orig) return prev;
      const copy = translateStroke({ ...orig, id: uid() }, offsetPx, offsetPx);
      strokesRef.current.push(copy);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redrawStrokes(ctx, strokesRef.current);
      return copy.id;
    });
    setShowContextMenu(false);
  }, []);

  const sendToBack = useCallback(() => {
    setSelectedId(prev => {
      if (!prev) return prev;
      const idx = strokesRef.current.findIndex(s => s.id === prev);
      if (idx <= 0) return prev;
      const [s] = strokesRef.current.splice(idx, 1);
      strokesRef.current.unshift(s);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redrawStrokes(ctx, strokesRef.current);
      return prev;
    });
    setShowContextMenu(false);
  }, []);

  const bringToFront = useCallback(() => {
    setSelectedId(prev => {
      if (!prev) return prev;
      const idx = strokesRef.current.findIndex(s => s.id === prev);
      if (idx < 0 || idx === strokesRef.current.length - 1) return prev;
      const [s] = strokesRef.current.splice(idx, 1);
      strokesRef.current.push(s);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redrawStrokes(ctx, strokesRef.current);
      return prev;
    });
    setShowContextMenu(false);
  }, []);

  const copyToClipboard = useCallback(() => {
    if (!selectedId) return;
    const orig = strokesRef.current.find(s => s.id === selectedId);
    if (orig) clipboardRef.current = { ...orig };
    setShowContextMenu(false);
  }, [selectedId]);

  const changeSelectedColor = useCallback((color: string) => {
    if (!selectedId) return;
    strokesRef.current = strokesRef.current.map(s =>
      s.id === selectedId ? { ...s, color } as AnyStroke : s
    );
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redrawStrokes(ctx, strokesRef.current);
    setSelectionFrame(f => f + 1);
  }, [selectedId]);

  const changeSelectedOpacity = useCallback((opacity: number) => {
    if (!selectedId) return;
    strokesRef.current = strokesRef.current.map(s =>
      s.id === selectedId ? { ...s, opacity } as AnyStroke : s
    );
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redrawStrokes(ctx, strokesRef.current);
    setSelectionFrame(f => f + 1);
  }, [selectedId]);

  // Close color menu on outside click
  useEffect(() => {
    if (!showColorMenu) return;
    const onDown = (e: PointerEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener('pointerdown', onDown, { capture: true });
    return () => document.removeEventListener('pointerdown', onDown, { capture: true });
  }, [showColorMenu]);

  // ── Text input ────────────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!textInput) return;
    const trimmed = textValue.trim();
    if (trimmed) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const stroke: TextStroke = {
          id: uid(),
          kind: 'text',
          color: textInput.color,
          fontSize: textInput.fontSize,
          opacity: state.annotateOpacity ?? 1,
          text: trimmed,
          position: { x: textInput.canvasX, y: textInput.canvasY },
        };
        strokesRef.current.push(stroke);
        redrawStrokes(ctx, strokesRef.current);
      }
    }
    setTextInput(null);
    setTextValue('');
  }, [textInput, textValue]);

  const dismissText = useCallback(() => {
    setTextInput(null);
    setTextValue('');
  }, []);

  // ── Pointer handlers on the canvas ────────────────────────────────
  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!state.annotateMode) return;

    if (textInput) { commitText(); return; }

    const tool = state.annotateTool;

    if (tool === 'select') {
      setShowContextMenu(false);
      const p = getPos(e);

      // Hit test strokes (reverse = top-first)
      let hit: AnyStroke | null = null;
      for (let i = strokesRef.current.length - 1; i >= 0; i--) {
        if (hitTest(strokesRef.current[i], p)) { hit = strokesRef.current[i]; break; }
      }

      if (hit) {
        setSelectedId(hit.id);
        e.currentTarget.setPointerCapture(e.pointerId);
        dragMode.current = 'move';
        dragStart.current = p;
      } else {
        setSelectedId(null);
        dragMode.current = null;
      }
      return;
    }

    if (tool === 'text') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      setTextInput({ screenX, screenY, canvasX: screenX * scaleX, canvasY: screenY * scaleY, color: state.annotateColor, fontSize });
      setTextValue('');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const p = getPos(e);

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      const globalOp = state.annotateOpacity ?? 1;
      const stroke: FreeStroke = {
        id: uid(), kind: 'free', tool,
        color: tool === 'eraser' ? '#000000' : state.annotateColor,
        lineWidth: tool === 'eraser' ? lw * 3 : lw,
        opacity: tool === 'eraser' ? 1 : tool === 'marker' ? MARKER_ALPHA * globalOp : globalOp,
        points: [p],
      };
      activeRef.current = stroke;
    } else {
      const stroke: ShapeStroke = {
        id: uid(), kind: 'shape', tool: tool as 'arrow' | 'rect',
        color: state.annotateColor, lineWidth: lw,
        opacity: state.annotateOpacity ?? 1,
        start: p, end: p,
      };
      activeRef.current = stroke;
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Select: drag-move (resize is handled by SVG overlay handlers)
    if (state.annotateTool === 'select' && dragMode.current === 'move' && selectedId) {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const p = getPos(e);
      const dx = p.x - dragStart.current.x;
      const dy = p.y - dragStart.current.y;
      dragStart.current = p;
      strokesRef.current = strokesRef.current.map(s => s.id === selectedId ? translateStroke(s, dx, dy) : s);
      redrawStrokes(ctx, strokesRef.current);
      // Force overlay re-render via counter
      setSelectionFrame(f => f + 1);
      return;
    }

    if (!isDrawing.current || !activeRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    const active = activeRef.current;

    if (active.kind === 'free') {
      active.points.push(p);
    } else if (active.kind === 'shape') {
      active.end = p;
    }
    redrawStrokes(ctx, [...strokesRef.current, active]);
  };

  const onCanvasPointerUp = () => {
    if (dragMode.current === 'move') {
      dragMode.current = null;
      return;
    }
    if (!isDrawing.current || !activeRef.current) return;
    isDrawing.current = false;
    strokesRef.current.push(activeRef.current);
    activeRef.current = null;
  };

  // ── Pointer handlers on the SVG overlay (handles) ─────────────────
  const onHandlePointerDown = (e: React.PointerEvent<SVGCircleElement>, handle: HandleName) => {
    e.stopPropagation();
    if (!selectedId) return;
    const sel = strokesRef.current.find(s => s.id === selectedId);
    if (!sel) return;
    const bb = getBBox(sel);
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    // Convert screen pointer to canvas coords
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragMode.current = 'resize';
    dragStart.current = { x: cx, y: cy };
    resizeHandle.current = handle;
    resizeBBoxStart.current = { ...bb };
  };

  const onHandlePointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (dragMode.current !== 'resize' || !resizeHandle.current || !resizeBBoxStart.current || !selectedId) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const delta = { x: cx - dragStart.current.x, y: cy - dragStart.current.y };
    const oldBB = resizeBBoxStart.current;
    const newBB = applyHandle(resizeHandle.current, oldBB, delta);

    strokesRef.current = strokesRef.current.map(s =>
      s.id === selectedId ? resizeStroke(s, oldBB, newBB) : s
    );

    const ctx = canvas.getContext('2d');
    if (ctx) redrawStrokes(ctx, strokesRef.current);

    // Update base for next frame
    resizeBBoxStart.current = newBB;
    dragStart.current = { x: cx, y: cy };

    setSelectionFrame(f => f + 1);
  };

  const onHandlePointerUp = () => {
    dragMode.current = null;
    resizeHandle.current = null;
    resizeBBoxStart.current = null;
  };

  const cursor = () => {
    if (!state.annotateMode) return 'default';
    if (state.annotateTool === 'select') return 'default';
    if (state.annotateTool === 'eraser') return 'cell';
    if (state.annotateTool === 'text') return 'text';
    return 'crosshair';
  };

  // ── Compute selection bbox in screen (CSS pixel) coordinates ──────
  // selectionFrame is read here to trigger re-render after drag/resize
  void selectionFrame;
  const selectedStroke = selectedId ? strokesRef.current.find(s => s.id === selectedId) : null;
  const canvasBB: BBox | null = selectedStroke ? getBBox(selectedStroke) : null;

  const screenBB = canvasBB
    ? (() => {
        const tl = toScreen({ x: canvasBB.x, y: canvasBB.y });
        const br = toScreen({ x: canvasBB.x + canvasBB.w, y: canvasBB.y + canvasBB.h });
        return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
      })()
    : null;

  const TOOLBAR_H = 40;
  const TOOLBAR_MARGIN = 10;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: state.annotateMode ? 'all' : 'none' }}>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: cursor() }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerLeave={onCanvasPointerUp}
      />

      {/* ── Selection overlay: bounding box + 8 handles via SVG ───── */}
      {screenBB && state.annotateTool === 'select' && (
        <svg
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            overflow: 'visible', zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          {/* Dashed bounding box outline */}
          <rect
            x={screenBB.x} y={screenBB.y} width={screenBB.w} height={screenBB.h}
            fill="none" stroke={HANDLE_COLOR} strokeWidth={1.5} strokeDasharray="5 4"
            opacity={0.85}
            style={{ pointerEvents: 'none' }}
          />
          {/* 8 interactive handles */}
          {HANDLE_NAMES.map(name => {
            const hPos = getHandlePositions(screenBB)[name];
            const cursor =
              name === 'N' || name === 'S' ? 'ns-resize' :
              name === 'W' || name === 'E' ? 'ew-resize' :
              name === 'NW' || name === 'SE' ? 'nwse-resize' :
              'nesw-resize';
            return (
              <circle
                key={name}
                cx={hPos.x} cy={hPos.y} r={HANDLE_RADIUS}
                fill={HANDLE_COLOR} stroke="#fff" strokeWidth={2}
                style={{ pointerEvents: 'all', cursor }}
                onPointerDown={e => onHandlePointerDown(e, name)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
              />
            );
          })}
        </svg>
      )}

      {/* ── Floating toolbar above selection ──────────────────────── */}
      {screenBB && state.annotateTool === 'select' && selectedStroke && (
        <div
          style={{
            position: 'absolute',
            left: screenBB.x + screenBB.w / 2,
            top: Math.max(TOOLBAR_H + 4, screenBB.y - TOOLBAR_MARGIN),
            transform: 'translate(-50%, -100%)',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(20,20,24,0.95)',
            borderRadius: 999,
            padding: '5px 10px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.65)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            zIndex: 40,
            pointerEvents: 'all',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Delete */}
          <button onClick={deleteSelected} title="Delete" style={{ ...TOOLBAR_BTN_STYLE, color: 'rgba(239,100,100,0.9)' }}>
            <TrashIcon />
          </button>

          {/* Duplicate */}
          <button onClick={() => duplicateSelected(16)} title="Duplicate" style={TOOLBAR_BTN_STYLE}>
            <DuplicateIcon />
          </button>

          {/* Color dot — click to open color picker */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setShowColorMenu(v => !v)}
              title="Change color"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: showColorMenu ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                outline: showColorMenu ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                transition: 'all 0.1s',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: 'color' in selectedStroke ? selectedStroke.color : '#fff',
                border: '2px solid rgba(255,255,255,0.4)',
                flexShrink: 0,
              }} />
            </button>

            {/* Color + Opacity popup */}
            {showColorMenu && (() => {
              const currentColor = 'color' in selectedStroke ? selectedStroke.color : '#ffffff';
              const currentOpacity = ('opacity' in selectedStroke && selectedStroke.opacity != null)
                ? selectedStroke.opacity : 1;
              return (
                <div
                  ref={colorMenuRef}
                  onPointerDown={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: 8,
                    background: 'rgba(20,20,24,0.97)',
                    borderRadius: 14,
                    padding: '10px 12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.75)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(16px)',
                    zIndex: 50,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    width: 160,
                  }}
                >
                  {/* ── Color section ── */}
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Color
                  </div>

                  {/* Preset grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {[
                      '#ffffff','#aaaaaa','#555555','#000000',
                      '#ef4444','#f97316','#eab308','#84cc16',
                      '#22c55e','#14b8a6','#06b6d4','#3b82f6',
                      '#6366f1','#a855f7','#ec4899',
                    ].map(col => {
                      const isActive = col === currentColor;
                      return (
                        <button
                          key={col}
                          onClick={() => changeSelectedColor(col)}
                          title={col}
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: col, border: 'none', cursor: 'pointer', padding: 0,
                            outline: isActive ? '2.5px solid rgba(255,255,255,0.9)' : '1.5px solid rgba(255,255,255,0.2)',
                            boxShadow: isActive ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none',
                            transition: 'all 0.12s',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Custom color row */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    fontSize: 11, color: 'rgba(255,255,255,0.6)',
                    padding: '4px 6px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{
                      width: 20, height: 20, flexShrink: 0,
                      position: 'relative',
                    }}>
                      <img
                        src={paletteIcon}
                        alt="palette"
                        style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }}
                      />
                      <input
                        type="color"
                        value={currentColor}
                        onChange={e => changeSelectedColor(e.target.value)}
                        style={{
                          position: 'absolute', inset: 0,
                          opacity: 0, width: '100%', height: '100%',
                          cursor: 'pointer', border: 'none', padding: 0,
                        }}
                      />
                    </div>
                    Personalizado
                  </label>

                  {/* ── Separator ── */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 -4px' }} />

                  {/* ── Opacity section ── */}
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Opacidad
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="range"
                      min={5} max={100} step={1}
                      value={Math.round(currentOpacity * 100)}
                      onChange={e => changeSelectedOpacity(Number(e.target.value) / 100)}
                      style={{ flex: 1, accentColor: '#a78bfa', height: 3, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', minWidth: 30, textAlign: 'right' }}>
                      {Math.round(currentOpacity * 100)}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)' }} />

          {/* ··· more */}
          <div style={{ position: 'relative' }}>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setShowContextMenu(v => !v)}
              title="More"
              style={{ ...TOOLBAR_BTN_STYLE, letterSpacing: 1 }}
            >
              ···
            </button>

            {/* Context menu */}
            {showContextMenu && (
              <div
                ref={contextMenuRef}
                style={{
                  position: 'absolute',
                  top: '100%', right: 0,
                  marginTop: 8,
                  background: 'rgba(20,20,24,0.97)',
                  borderRadius: 14,
                  padding: '6px 0',
                  minWidth: 180,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.75)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 50,
                }}
              >
                <ContextMenuItem icon={<CopyIcon />} label="Copy" onClick={copyToClipboard} />
                <ContextMenuItem icon={<DuplicateIcon />} label="Duplicate" onClick={() => duplicateSelected(16)} />
                <ContextMenuItem icon={<TrashIcon />} label="Delete" onClick={deleteSelected} danger />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <ContextMenuItem icon={<BackIcon />} label="Send to back" onClick={sendToBack} />
                <ContextMenuItem icon={<FrontIcon />} label="Bring to front" onClick={bringToFront} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating text editor */}
      {textInput && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(textInput.screenX, (canvasRef.current?.clientWidth ?? 9999) - 260),
            top: textInput.screenY,
            zIndex: 50,
            display: 'flex', flexDirection: 'column', gap: 6,
            filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.7))',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') dismissText();
            }}
            placeholder="Type here…"
            style={{
              width: 240,
              background: 'rgba(18,18,22,0.92)',
              border: `1.5px solid ${textInput.color}`,
              borderRadius: 8,
              color: textInput.color,
              fontSize: Math.min(textInput.fontSize, 24),
              fontWeight: 700, fontFamily: 'Inter, sans-serif',
              padding: '7px 10px',
              caretColor: textInput.color, outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
          />
          <div style={{ display: 'flex', gap: 5 }}>
            <button onPointerDown={e => e.stopPropagation()} onClick={commitText}
              style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', background: textInput.color, color: '#000', fontSize: 11, fontWeight: 700 }}>
              Place ↵
            </button>
            <button onPointerDown={e => e.stopPropagation()} onClick={dismissText}
              style={{ padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700 }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const TOOLBAR_BTN_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8,
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'rgba(255,255,255,0.85)', fontSize: 14,
  transition: 'background 0.12s',
};

// ── Context menu item ────────────────────────────────────────────────
function ContextMenuItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 16px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: danger ? '#ef4444' : 'rgba(255,255,255,0.82)',
        fontSize: 13, textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span style={{ flexShrink: 0, opacity: 0.7 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Icons ────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
function DuplicateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17h18M3 12h12M3 7h6"/>
    </svg>
  );
}
function FrontIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18M9 12h12M15 17h6"/>
    </svg>
  );
}
