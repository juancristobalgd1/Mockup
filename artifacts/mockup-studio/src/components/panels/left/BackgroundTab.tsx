import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Shuffle, Wand2, Image as ImageIcon, Video, Sparkles } from 'lucide-react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';
import { 
  GRADIENTS, 
  MESH_GRADIENTS, 
  PATTERNS, 
  WALLPAPERS, 
  ANIMATED_BACKGROUNDS, 
  ANIMATED_BG_KEYFRAMES 
} from '../../../data/backgrounds';
import { extractColorsFromImage, clampL, safeW } from '../../../utils/panelUtils';

interface BackgroundTabProps {
  mobileView?: 'hub' | 'content';
  setMobileView?: (view: 'hub' | 'content') => void;
}

export const BackgroundTab = ({ mobileView, setMobileView }: BackgroundTabProps) => {
  const { state, updateState } = useApp();
  const [bgPopup, setBgPopup] = useState<null | string>(null);
  const [bgPopupAnchor, setBgPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const bgPopupRef = useRef<HTMLDivElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const bgVideoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (bgPopup && bgPopupRef.current && !bgPopupRef.current.contains(e.target as Node)) {
        setBgPopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [bgPopup]);

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ bgType: 'image', bgImage: URL.createObjectURL(file), bgVideo: null });
  };

  const handleBgVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ bgType: 'video', bgVideo: URL.createObjectURL(file), bgImage: null });
  };

  const handleShuffle = () => {
    const pool = [
      ...GRADIENTS.map(g => ({ bgType: 'gradient' as const, bgColor: g.id })),
      ...MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => ({ bgType: 'mesh' as const, bgColor: m.id })),
      ...WALLPAPERS.map(w => ({ bgType: 'wallpaper' as const, bgColor: w.id })),
    ];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    updateState(pick);
  };

  const handleAutoBackground = async () => {
    if (!state.screenshotUrl) return;
    setExtracting(true);
    try {
      const colors = await extractColorsFromImage(state.screenshotUrl);
      if (colors.length < 2) return;
      const [c1, c2, c3, c4] = colors;
      const meshCss = [
        `radial-gradient(at 20% 20%, ${c1} 0px, transparent 50%)`,
        `radial-gradient(at 80% 10%, ${c2} 0px, transparent 50%)`,
        c3 ? `radial-gradient(at 70% 80%, ${c3} 0px, transparent 50%)` : '',
        c4 ? `radial-gradient(at 10% 70%, ${c4} 0px, transparent 50%)` : '',
        '#0a0a14',
      ].filter(Boolean).join(', ');
      updateState({ bgType: 'mesh', bgColor: '__auto__' });
      const existing = MESH_GRADIENTS.find(m => m.id === '__auto__');
      if (existing) { existing.css = meshCss; }
      else MESH_GRADIENTS.push({ id: '__auto__', label: 'Auto', css: meshCss });
    } finally { setExtracting(false); }
  };

  const THUMB: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 10, marginBottom: 5,
    border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
  const SWATCH_BTN = (active: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 7px 7px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
    outline: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.10)',
    transition: 'all 0.12s', flexShrink: 0,
  });
  const SWATCH_LABEL = (active: boolean): React.CSSProperties => ({
    fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
    color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
    whiteSpace: 'nowrap',
  });

  const NO_POPUP_TYPES = new Set(['none', 'transparent']);
  const bgTypeCards = [
    { id: 'none', label: 'Ninguno', preview: { background: '#111113' }, icon:
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    },
    { id: 'solid', label: 'Sólido', preview: { background: state.bgType === 'solid' ? state.bgColor : '#374151' } },
    { id: 'gradient', label: 'Degradado', preview: { background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)' } },
    { id: 'mesh', label: 'Malla', preview: { background: 'radial-gradient(at 30% 20%, #0ea5e9 0px, transparent 55%), radial-gradient(at 80% 70%, #ec4899 0px, transparent 55%), #03111e' } },
    { id: 'wallpaper', label: 'Fondo de Pantalla', preview: { background: 'radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #60a5fa 60%, #dbeafe 100%)' } },
    { id: 'pattern', label: 'Patrón', preview: { backgroundColor: '#1a1c2e', backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '10px 10px' } },
    { id: 'image', label: 'Imagen', preview: null },
    { id: 'video', label: 'Video', preview: null, icon: <Video size={16} color="rgba(255,255,255,0.40)" /> },
    { id: 'transparent', label: 'Alfa', preview: null, icon:
        <div style={{
          width: '100%', height: '100%', borderRadius: 10,
          backgroundImage: 'linear-gradient(45deg, #3a3a3a 25%, transparent 25%), linear-gradient(-45deg, #3a3a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3a3a3a 75%), linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          backgroundColor: '#222',
        }} />
    },
    { id: 'animated', label: 'Animado', preview: null, icon:
        <div style={{
          width: '100%', height: '100%', borderRadius: 10,
          background: 'linear-gradient(-45deg, #7e22ce, #0ea5e9, #ec4899, #f59e0b)',
          backgroundSize: '300% 300%',
          animation: 'bgShift 4s ease infinite',
        }} />
    },
  ];

  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: bgPopupAnchor ? clampL(bgPopupAnchor.x, 262, -130) : 0,
    bottom: bgPopupAnchor ? window.innerHeight - bgPopupAnchor.y + 8 : 0,
    width: safeW(262),
    background: 'rgba(18,20,26,0.98)',
    borderRadius: 18, padding: 14, zIndex: 9999,
    boxShadow: '0 8px 40px rgba(0,0,0,0.80), 0 2px 12px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(22px)',
    maxHeight: 'min(calc(100vh - 80px), 80vh)',
    overflowY: 'auto',
  };



  const isMobile = window.innerWidth <= 768;

  return (
    <div className="panel-text-contrast">
      <style>{ANIMATED_BG_KEYFRAMES}</style>

      {/* Primary Contextual Options based on state.bgType */}
      {(!isMobile || !state.showBgSettings) && (
        <div style={{ marginBottom: 20 }}>
        {state.bgType === 'solid' && (
          <Section label="Color Sólido">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: state.bgColor, border: '1px solid rgba(255,255,255,0.12)' }} />
                <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
              <input type="text" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                className="rt-input" style={{ fontFamily: 'monospace', flex: 1, height: 44, fontSize: 13 }} />
            </div>
          </Section>
        )}

        {state.bgType === 'gradient' && (
          <Section label="Degradados">
            <div className="ps-responsive-list">
              {GRADIENTS.map(g => {
                const active = state.bgColor === g.id;
                return (
                  <button key={g.id} onClick={() => updateState({ bgColor: g.id })} style={SWATCH_BTN(active)}>
                    <div style={{ ...THUMB, background: g.css, width: '100%', height: 50 }} />
                    <span style={SWATCH_LABEL(active)}>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {state.bgType === 'mesh' && (
          <Section label="Degradados de Malla" action={
            state.screenshotUrl && (
              <button onClick={handleAutoBackground} disabled={extracting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                  fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                }}>
                <Wand2 size={12} /> {extracting ? '...' : 'Auto'}
              </button>
            )
          }>
            <div className="ps-responsive-list">
              {MESH_GRADIENTS.map(m => {
                const active = state.bgColor === m.id;
                return (
                  <button key={m.id} onClick={() => updateState({ bgColor: m.id })} style={SWATCH_BTN(active)}>
                    <div style={{ ...THUMB, background: m.css, width: '100%', height: 50 }} />
                    <span style={SWATCH_LABEL(active)}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {state.bgType === 'wallpaper' && (
          <Section label="Fondos de Pantalla">
            <div className="ps-responsive-list">
              {WALLPAPERS.map(w => {
                const active = state.bgColor === w.id;
                return (
                  <button key={w.id} onClick={() => updateState({ bgColor: w.id })} style={SWATCH_BTN(active)}>
                    <div style={{ ...THUMB, background: w.css, width: '100%', height: 50 }} />
                    <span style={SWATCH_LABEL(active)}>{w.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {state.bgType === 'pattern' && (
          <Section label="Patrones">
            <div className="ps-responsive-list">
              {PATTERNS.map(p => {
                const active = state.bgPattern === p.id;
                return (
                  <button key={p.id} onClick={() => updateState({ bgPattern: p.id })} style={SWATCH_BTN(active)}>
                    <div style={{ ...THUMB, ...p.bgStyle('#1a1c2e', state.bgPatternColor), width: '100%', height: 50 }} />
                    <span style={SWATCH_LABEL(active)}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {state.bgType === 'animated' && (
          <Section label="Animados">
            <div className="ps-responsive-list">
              {ANIMATED_BACKGROUNDS.map(bg => {
                const active = state.bgAnimated === bg.id;
                return (
                  <button key={bg.id} onClick={() => updateState({ bgAnimated: bg.id })}
                    style={{
                      position: 'relative', border: 'none', padding: 0, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                      outline: active ? '2.5px solid rgba(167,139,250,0.9)' : '1px solid rgba(255,255,255,0.1)',
                    }}>
                    <div style={{ width: '100%', aspectRatio: '16/10', ...bg.thumb }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '6px', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                      {bg.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {state.bgType === 'image' && (
          <Section label="Imagen Personalizada">
            {state.bgImage && (
              <div style={{ width: '100%', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={state.bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="bg" />
              </div>
            )}
            <button onClick={() => bgFileRef.current?.click()}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer',
              }}>
              {state.bgImage ? 'Cambiar Imagen' : '+ Subir Imagen'}
            </button>
            <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgImage} />
          </Section>
        )}

        {state.bgType === 'video' && (
          <Section label="Video Personalizado">
            {state.bgVideo && (
              <div style={{ width: '100%', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 12, border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
                <video src={state.bgVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop playsInline />
              </div>
            )}
            <button onClick={() => bgVideoFileRef.current?.click()}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)',
                color: '#fff', cursor: 'pointer',
              }}>
              {state.bgVideo ? 'Cambiar Video' : '+ Subir Video'}
            </button>
            <input ref={bgVideoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleBgVideo} />
          </Section>
        )}
        </div>
      )}

      {/* Global Adjustments (Opacity, Effects) */}
      {(isMobile ? state.showBgSettings : true) && state.bgType !== 'none' && state.bgType !== 'transparent' && (
        <div style={{ borderTop: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)', paddingTop: isMobile ? 0 : 20 }}>
          <Section label="Ajustes Globales" action={
            <button onClick={handleShuffle} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
              fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            }}>
              <Shuffle size={12} /> Mix
            </button>
          }>
            {/* Opacity slider info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Opacidad</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{state.bgOpacity}%</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={state.bgOpacity}
                onChange={e => updateState({ bgOpacity: Number(e.target.value) })}
                className="ms-range" />
            </div>

            {/* Effects info */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => updateState({ bgBlur: state.bgBlur > 0 ? 0 : 8 })}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: state.bgBlur > 0 ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                  color: state.bgBlur > 0 ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.4)',
                  border: state.bgBlur > 0 ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}>Desenfoque</button>
              <button onClick={() => updateState({ grain: !state.grain })}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: state.grain ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                  color: state.grain ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.4)',
                  border: state.grain ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}>Ruido</button>
              <button onClick={() => updateState({ bgVignette: !state.bgVignette })}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: state.bgVignette ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
                  color: state.bgVignette ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.4)',
                  border: state.bgVignette ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}>Viñeta</button>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};
