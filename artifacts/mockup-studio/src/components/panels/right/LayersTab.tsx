import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';

interface FontSizeSliderProps {
  value: number;
  onCommit: (v: number) => void;
}

const FontSizeSlider = ({ value, onCommit }: { value: number; onCommit: (v: number) => void }) => {
  const [local, setLocal] = useState(value);
  const isDragging = useRef(false);
  const pending = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => { if (!isDragging.current) setLocal(value); }, [value]);

  const scheduleFlush = (v: number) => {
    pending.current = v;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (pending.current !== null) { onCommit(pending.current); pending.current = null; }
        rafId.current = 0;
      });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: 'var(--rt-text-3)', minWidth: 28, fontWeight: 600 }}>TAMAÑO</span>
      <input type="range" min={10} max={120} value={local}
        className="flex-1 ms-range"
        onChange={e => { const v = Number(e.target.value); setLocal(v); scheduleFlush(v); }}
        onPointerDown={() => { isDragging.current = true; }}
        onPointerUp={e => {
          isDragging.current = false;
          if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
          pending.current = null;
          onCommit(Number(e.currentTarget.value));
        }}
      />
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--rt-text-3)', minWidth: 24, textAlign: 'right' }}>{local}</span>
    </div>
  );
};

interface LayersTabProps {
  textOverlays: import('../../../store').TextOverlay[];
  onUpdateText: (id: string, updates: Partial<import('../../../store').TextOverlay>) => void;
  onRemoveText: (id: string) => void;
}

export const LayersTab = ({ textOverlays, onUpdateText, onRemoveText }: LayersTabProps) => {
  if (textOverlays.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--rt-text-3)', fontStyle: 'italic' }}>
          Sin capas de texto en la escena.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {textOverlays.map(overlay => (
        <div key={overlay.id}
          style={{
            borderRadius: 14, padding: '12px',
            background: 'var(--rt-panel-3)',
            border: '1px solid var(--rt-border-mid)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
          
          <input type="text" value={overlay.text}
            onChange={e => onUpdateText(overlay.id, { text: e.target.value })}
            className="rt-input"
            style={{ marginBottom: 12, fontSize: 12, padding: '6px 8px' }}
            placeholder="Texto de la capa..."
          />

          <FontSizeSlider
            value={overlay.fontSize}
            onCommit={v => onUpdateText(overlay.id, { fontSize: v })}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--rt-text-3)', fontWeight: 600, minWidth: 28 }}>COLOR</span>
            <div style={{ position: 'relative', width: 24, height: 24, borderRadius: 6, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--rt-border-mid)' }}>
              <input type="color" value={overlay.color}
                onChange={e => onUpdateText(overlay.id, { color: e.target.value })}
                style={{ position: 'absolute', inset: -4, width: 32, height: 32, cursor: 'pointer', border: 'none', background: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              <button onClick={() => onUpdateText(overlay.id, { isBold: !overlay.isBold })}
                className="btn-press"
                style={{
                  width: 28, height: 28, borderRadius: 6, fontSize: 11, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: overlay.isBold ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                  color: overlay.isBold ? 'var(--rt-text)' : 'var(--rt-text-3)',
                  border: `1px solid ${overlay.isBold ? 'rgba(255,255,255,0.2)' : 'var(--rt-border)'}`,
                  cursor: 'pointer'
                }}>B</button>
              
              <button onClick={() => onUpdateText(overlay.id, { isItalic: !overlay.isItalic })}
                className="btn-press"
                style={{
                  width: 28, height: 28, borderRadius: 6, fontSize: 11, fontStyle: 'italic',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: overlay.isItalic ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                  color: overlay.isItalic ? 'var(--rt-text)' : 'var(--rt-text-3)',
                  border: `1px solid ${overlay.isItalic ? 'rgba(255,255,255,0.2)' : 'var(--rt-border)'}`,
                  cursor: 'pointer'
                }}>I</button>
            </div>

            <button onClick={() => onRemoveText(overlay.id)}
              className="btn-press"
              style={{
                marginLeft: 10, fontSize: 10, color: 'var(--rt-accent-red)', fontWeight: 700,
                background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8
              }}>
              ELIMINAR
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
