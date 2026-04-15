import * as React from 'react';
import { useState } from 'react';
import { Download, Copy, Image as ImageIcon, Video, Film, Check, Sparkles, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useApp } from '../../../store';
import { Section, Chip } from '../../ui/PanelUI';
import { toast } from 'sonner';

export const EXPORT_SIZES = [
  { id: 'ig-post',  label: 'Publicación', platform: 'Instagram', icon: Instagram, w: 1080, h: 1080 },
  { id: 'ig-story', label: 'Historia',    platform: 'Instagram', icon: Instagram, w: 1080, h: 1920 },
  { id: 'ig-port',  label: 'Retrato',     platform: 'Instagram', icon: Instagram, w: 1080, h: 1350 },
  { id: 'twitter',  label: 'Tarjeta',     platform: 'Twitter',   icon: Twitter,   w: 1200, h: 675  },
  { id: 'linkedin', label: 'Feed Post',   platform: 'LinkedIn',  icon: Linkedin,  w: 1200, h: 628  },
  { id: 'wide',     label: 'Video/Intro', platform: 'YouTube',   icon: Youtube,   w: 1920, h: 1080 },
] as const;

interface ExportTabProps {
  onDownloadPNG: () => void;
  onDownloadVideo: () => void;
  onCopy: () => void;
  exporting: boolean;
  copying: boolean;
  copied: boolean;
  recording: boolean;
  recordProgress: number;
  recordSecsLeft: number;
  canDownloadVideo: boolean;
  isMovieMode: boolean;
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
  onCopy,
  exporting,
  copying,
  copied,
  recording,
  recordProgress,
  recordSecsLeft,
  canDownloadVideo,
  isMovieMode,
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
  const hasVideoSource = Boolean(state.videoUrl || isMovieMode);
  const [exportType, setExportType] = useState<'image' | 'video'>('image');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn-press"
          onClick={() => setExportType('image')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: exportType === 'image' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
            background: exportType === 'image' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            color: exportType === 'image' ? 'var(--rt-text)' : 'var(--rt-text-2)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >Imagen</button>
        <button
          className="btn-press"
          onClick={() => setExportType('video')}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: exportType === 'video' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
            background: exportType === 'video' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            color: exportType === 'video' ? 'var(--rt-text)' : 'var(--rt-text-2)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >Video</button>
      </div>

      {/* Primary Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {exportType === 'image' ? (
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
              {exporting ? 'Exportando...' : 'Descargar imagen'}
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
        ) : (
          <>
            <div style={{ display: 'grid', gap: 12 }}>
              <Section label="Resolución">
                <div style={{ display: 'flex', gap: 4 }}>
                  {([1, 2, 3] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setExportScale(s)}
                      className="btn-press"
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 10,
                        border: exportScale === s ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                        background: exportScale === s ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                        color: exportScale === s ? 'var(--rt-text)' : 'var(--rt-text-2)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {s === 1 ? '1×' : s === 2 ? '2× HD' : '3× 4K'}
                    </button>
                  ))}
                </div>
              </Section>

              <Section label="FPS">
                <div style={{ display: 'flex', gap: 4 }}>
                  {([30, 60] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportFps(f)}
                      className="btn-press"
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 10,
                        border: exportFps === f ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                        background: exportFps === f ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                        color: exportFps === f ? 'var(--rt-text)' : 'var(--rt-text-2)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {f} fps
                    </button>
                  ))}
                </div>
              </Section>
            </div>
            <button
              onClick={onDownloadVideo}
              disabled={!canDownloadVideo || recording}
              className="btn-press"
              style={{
                width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: recording ? 'rgba(30,12,8,0.9)' : 'rgba(255,255,255,0.95)',
                color: recording ? '#fca5a5' : '#0d0e0f',
                border: recording ? '1px solid rgba(239,68,68,0.3)' : 'none',
                cursor: !canDownloadVideo || recording ? 'not-allowed' : 'pointer',
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
                {recording ? <Film size={14} /> : <Video size={14} />}
                {recording ? `Renderizando (${recordSecsLeft}s)` : 'Descargar video'}
              </span>
            </button>
            {!hasVideoSource && (
              <p style={{ fontSize: 12, color: 'var(--rt-text-3)', marginTop: 4 }}>
                No hay video disponible. Carga un video o activa el modo película para generar video.
              </p>
            )}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <s.icon size={10} style={{ color: active ? 'var(--rt-text)' : 'var(--rt-text-3)' }} />
                    <span style={{ fontSize: 9, color: active ? 'var(--rt-text)' : 'var(--rt-text-3)' }}>{s.platform}</span>
                  </div>
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
