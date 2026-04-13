import * as React from 'react';
import { useState } from 'react';
import { Download, Copy, Image as ImageIcon, Video, Film, Check, Sparkles } from 'lucide-react';
import { useApp } from '../../../store';
import { Section, Chip } from '../../ui/PanelUI';
import { toast } from 'sonner';

export const EXPORT_SIZES = [
  { id: 'ig-post',  label: 'Publicación', platform: 'Instagram', w: 1080, h: 1080 },
  { id: 'ig-story', label: 'Historia',    platform: 'Instagram', w: 1080, h: 1920 },
  { id: 'ig-port',  label: 'Retrato',     platform: 'Instagram', w: 1080, h: 1350 },
  { id: 'twitter',  label: 'Tarjeta',     platform: 'X / Twitter', w: 1200, h: 675  },
  { id: 'linkedin', label: 'Publicación', platform: 'LinkedIn',  w: 1200, h: 628  },
  { id: 'wide',     label: 'Panorámico',  platform: 'YouTube / Slides', w: 1920, h: 1080 },
] as const;

interface ExportTabProps {
  onDownloadPNG: () => void;
  onDownloadVideo: () => void;
  onRecordWebM: () => void;
  onCopy: () => void;
  exporting: boolean;
  copying: boolean;
  copied: boolean;
  recording: boolean;
  recordProgress: number;
  recordSecsLeft: number;
  selectedSize: string;
  setSelectedSize: (id: string) => void;
  exportScale: number;
  setExportScale: (s: 1|2|3) => void;
  exportFps: number;
  setExportFps: (f: 30|60) => void;
  exportTransparent: boolean;
  setExportTransparent: (v: boolean) => void;
}

export const ExportTab = ({
  onDownloadPNG,
  onDownloadVideo,
  onRecordWebM,
  onCopy,
  exporting,
  copying,
  copied,
  recording,
  recordProgress,
  recordSecsLeft,
  selectedSize,
  setSelectedSize,
  exportScale,
  setExportScale,
  exportFps,
  setExportFps,
  exportTransparent,
  setExportTransparent
}: ExportTabProps) => {
  const { state } = useApp();
  const isVideo = state.contentType === 'video';
  const isMovieMode = state.creationMode === 'movie';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Primary Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isMovieMode ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
              <Section label="Resolución">
                <div style={{ display: 'flex', gap: 4 }}>
                  {([1, 2, 3] as const).map(s => (
                    <Chip key={s} active={exportScale === s} onClick={() => setExportScale(s)} style={{ flex: 1, padding: '6px 0', textAlign: 'center' }}>
                      {s === 1 ? '1×' : s === 2 ? '2× HD' : '3× 4K'}
                    </Chip>
                  ))}
                </div>
              </Section>

              <Section label="FPS">
                <div style={{ display: 'flex', gap: 4 }}>
                  {([30, 60] as const).map(f => (
                    <Chip key={f} active={exportFps === f} onClick={() => setExportFps(f)} style={{ flex: 1, padding: '6px 0', textAlign: 'center' }}>
                      {f} fps
                    </Chip>
                  ))}
                </div>
              </Section>

              <button
                onClick={() => setExportTransparent(!exportTransparent)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 10, border: '1px solid var(--rt-border)', cursor: 'pointer',
                  background: exportTransparent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                  color: exportTransparent ? '#60a5fa' : 'var(--rt-text-2)',
                  fontSize: 11, fontWeight: 600, transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `1.5px solid ${exportTransparent ? '#60a5fa' : 'rgba(255,255,255,0.2)'}`,
                  background: exportTransparent ? '#60a5fa' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {exportTransparent && <Check size={10} color="white" strokeWidth={3} />}
                </div>
                Fondo transparente
              </button>
            </div>

            <button
              onClick={onRecordWebM}
              disabled={recording}
              className="btn-press"
              style={{
                width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: recording ? 'rgba(30,12,8,0.9)' : 'rgba(255,255,255,0.95)',
                color: recording ? '#fca5a5' : '#0d0e0f',
                border: recording ? '1px solid rgba(239,68,68,0.3)' : 'none',
                cursor: recording ? 'not-allowed' : 'pointer',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {recording && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${recordProgress}%`, background: 'rgba(239,68,68,0.2)',
                  transition: 'width 0.1s linear', zIndex: 0
                }} />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {recording ? <Film size={14} /> : <Download size={14} />}
                {recording ? `Renderizando (${recordSecsLeft}s)` : 'Descargar video'}
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onDownloadPNG}
              disabled={exporting}
              className="btn-press"
              style={{
                width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: exporting ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)',
                color: exporting ? 'rgba(255,255,255,0.3)' : '#0d0e0f',
                border: 'none', cursor: exporting ? 'not-allowed' : 'pointer'
              }}
            >
              <Download size={14} />
              {exporting ? 'Exportando...' : 'Descargar PNG'}
            </button>

            <button
              onClick={onCopy}
              disabled={copying || copied}
              className="btn-press"
              style={{
                width: '100%', padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: copied ? 'rgba(48,209,88,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied ? 'rgba(48,209,88,0.3)' : 'var(--rt-border)'}`,
                color: copied ? 'var(--rt-accent-green)' : 'var(--rt-text-2)',
                cursor: copying ? 'not-allowed' : 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '¡Copiado!' : copying ? 'Copiando...' : 'Copiar al portapapeles'}
            </button>
          </>
        )}
      </div>

      {/* Export Size Visuals */}
      {!isVideo && (
        <Section label="Tamaño de Exportación">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {EXPORT_SIZES.map(s => {
              const active = selectedSize === s.id;
              const ratio = s.w / s.h;
              // Visual ratio card
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s.id)}
                  className="btn-press"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '10px', borderRadius: 12, border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'var(--rt-border)'}`,
                    background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden'
                  }}>
                    <div style={{
                      width: ratio > 1 ? 30 : 30 * ratio,
                      height: ratio > 1 ? 30 / ratio : 30,
                      border: '1.5px solid rgba(255,255,255,0.25)',
                      borderRadius: 2,
                      background: active ? 'rgba(255,255,255,0.1)' : 'transparent'
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--rt-text-3)', marginBottom: 2 }}>{s.platform}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--rt-text)' : 'var(--rt-text-2)' }}>{s.label}</span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--rt-text-3)', marginTop: 4 }}>{s.w}×{s.h}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Footer Info */}
      <div style={{ marginTop: 8, padding: '0 4px' }}>
        <p style={{ fontSize: 10, color: 'var(--rt-text-3)', lineHeight: 1.6 }}>
          Suelte imágenes o videos en la pantalla del dispositivo. Pegue una URL para capturar un screenshot. Arrastre capas de texto en el lienzo.
        </p>
      </div>
    </div>
  );
};
