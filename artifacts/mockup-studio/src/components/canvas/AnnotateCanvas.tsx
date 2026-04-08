import { useRef, useEffect, useCallback, useState } from 'react';
import { useApp } from '../../store';

type Point = { x: number; y: number };

interface FreeStroke {
  kind: 'free';
  tool: 'pen' | 'marker' | 'eraser';
  color: string;
  lineWidth: number;
  opacity: number;
  points: Point[];
}

interface ShapeStroke {
  kind: 'shape';
  tool: 'arrow' | 'rect';
  color: string;
  lineWidth: number;
  start: Point;
  end: Point;
}

interface TextStroke {
  kind: 'text';
  color: string;
  fontSize: number;
  text: string;
  position: Point;
}

type AnyStroke = FreeStroke | ShapeStroke | TextStroke;

const SIZE_MAP: Record<string, number> = { S: 2, M: 5, L: 10, XL: 18 };
const MARKER_ALPHA = 0.45;

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
      ctx.fillStyle = s.color;
      ctx.font = `bold ${s.fontSize}px Inter, sans-serif`;
      ctx.fillText(s.text, s.position.x, s.position.y);
    }
    ctx.restore();
  }
}

export function AnnotateCanvas() {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<AnyStroke[]>([]);
  const activeRef = useRef<AnyStroke | null>(null);
  const isDrawing = useRef(false);

  const [textInput, setTextInput] = useState<{ x: number; y: number; canvasX: number; canvasY: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  const lw = SIZE_MAP[state.annotateSize] ?? 5;

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Resize canvas to match display size
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

  // Clear when annotateClearKey changes
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    strokesRef.current = [];
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }, [state.annotateClearKey]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!state.annotateMode) return;
    const tool = state.annotateTool;
    if (tool === 'text') {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      setTextInput({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        canvasX: (e.clientX - rect.left) * scaleX,
        canvasY: (e.clientY - rect.top) * scaleY,
      });
      setTextValue('');
      return;
    }

    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const p = getPos(e);

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      const stroke: FreeStroke = {
        kind: 'free',
        tool,
        color: tool === 'eraser' ? '#000000' : state.annotateColor,
        lineWidth: tool === 'eraser' ? lw * 3 : lw,
        opacity: tool === 'marker' ? MARKER_ALPHA : 1,
        points: [p],
      };
      activeRef.current = stroke;
    } else {
      const stroke: ShapeStroke = {
        kind: 'shape',
        tool: tool as 'arrow' | 'rect',
        color: state.annotateColor,
        lineWidth: lw,
        start: p,
        end: p,
      };
      activeRef.current = stroke;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

  const onPointerUp = () => {
    if (!isDrawing.current || !activeRef.current) return;
    isDrawing.current = false;
    strokesRef.current.push(activeRef.current);
    activeRef.current = null;
  };

  const commitText = () => {
    if (!textInput || !textValue.trim()) { setTextInput(null); return; }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) { setTextInput(null); return; }
    const fontSize = lw * 4 + 10;
    const stroke: TextStroke = {
      kind: 'text',
      color: state.annotateColor,
      fontSize,
      text: textValue,
      position: { x: textInput.canvasX, y: textInput.canvasY },
    };
    strokesRef.current.push(stroke);
    redrawStrokes(ctx, strokesRef.current);
    setTextInput(null);
    setTextValue('');
  };

  const cursor = () => {
    if (!state.annotateMode) return 'default';
    if (state.annotateTool === 'eraser') return 'cell';
    if (state.annotateTool === 'text') return 'text';
    return 'crosshair';
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: state.annotateMode ? 'all' : 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: cursor() }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Inline text input */}
      {textInput && (
        <input
          autoFocus
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextInput(null); }}
          onBlur={commitText}
          style={{
            position: 'absolute',
            left: textInput.x,
            top: textInput.y - 14,
            background: 'transparent',
            border: 'none',
            outline: '1px dashed rgba(255,255,255,0.5)',
            color: state.annotateColor,
            fontSize: lw * 4 + 10,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            minWidth: 120,
            caretColor: state.annotateColor,
            padding: '2px 4px',
          }}
          placeholder="Type here…"
        />
      )}
    </div>
  );
}
