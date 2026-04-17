import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Shuffle, Wand2, Image as ImageIcon, Video, Sparkles, Pipette, Contrast, Droplet } from 'lucide-react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';
import {
  GRADIENTS,
  MESH_GRADIENTS,
  PATTERNS,
  WALLPAPERS,
  ANIMATED_BACKGROUNDS,
  ANIMATED_BG_KEYFRAMES,
  SOLIDS
} from '../../../data/backgrounds';
import { GRADIENT_ASSETS, TEXTURE_ASSETS, WALLPAPER_ASSETS } from '../../../data/backgroundAssets';
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
    const pool: any[] = [
      ...GRADIENTS.map(g => ({ bgType: 'gradient' as const, bgColor: g.id })),
      ...MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => ({ bgType: 'mesh' as const, bgColor: m.id })),
      ...WALLPAPERS.map(w => ({ bgType: 'wallpaper' as const, bgColor: w.id })),
      ...GRADIENT_ASSETS.map(g => ({ bgType: 'gradient-custom' as const, bgImage: g.url, bgVideo: null })),
      ...TEXTURE_ASSETS.map(t => ({ bgType: 'texture' as const, bgImage: t.url, bgVideo: null })),
      ...WALLPAPER_ASSETS.map(w => ({ bgType: 'wallpaper-custom' as const, bgImage: w.url, bgVideo: null })),
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
    {
      id: 'none', label: 'Ninguno', preview: { background: '#ffffff' }, icon:
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    },
    { id: 'transparent', label: 'Alfa', preview: null, icon:
        <div style={{
          width: '100%', height: '100%', borderRadius: 10,
          backgroundImage: 'linear-gradient(45deg, #3a3a3a 25%, transparent 25%), linear-gradient(-45deg, #3a3a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3a3a3a 75%), linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          backgroundColor: '#222',
        }} />
    },
    { id: 'separator', type: 'separator' },
    { id: 'solid', label: 'Sólido', preview: { background: state.bgType === 'solid' ? state.bgColor : '#374151' } },
    { id: 'gradient', label: 'Degradado', preview: { background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)' } },
    { id: 'mesh', label: 'Malla', preview: { background: 'radial-gradient(at 30% 20%, #0ea5e9 0px, transparent 55%), radial-gradient(at 80% 70%, #ec4899 0px, transparent 55%), #03111e' } },
    { id: 'gradient-custom', label: 'Gradientes', preview: { background: GRADIENT_ASSETS.length > 0 ? `url(${GRADIENT_ASSETS[0].url})` : 'transparent' } },
    { id: 'wallpaper-custom', label: 'Wallpapers', preview: { background: WALLPAPER_ASSETS.length > 0 ? `url(${WALLPAPER_ASSETS[0].url})` : 'transparent' } },
    { id: 'texture', label: 'Texturas', preview: { background: TEXTURE_ASSETS.length > 0 ? `url(${TEXTURE_ASSETS[0].url})` : 'transparent' } },
    { id: 'wallpaper', label: 'Fondo de Pantalla', preview: { background: 'radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #60a5fa 60%, #dbeafe 100%)' } },
    { id: 'pattern', label: 'Patrón', preview: { backgroundColor: '#1a1c2e', backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '10px 10px' } },
    { id: 'video', label: 'Video', preview: null, icon: <Video size={16} color="rgba(255,255,255,0.40)" /> },
    {
      id: 'animated', label: 'Animado', preview: null, icon:
        <div style={{
          width: '100%', height: '100%', borderRadius: 10,
          background: 'linear-gradient(-45deg, #7e22ce, #0ea5e9, #ec4899, #f59e0b)',
          backgroundSize: '300% 300%',
          animation: 'bgShift 4s ease infinite',
        }} />
    },
    { id: 'image', label: 'Imagen', preview: null },
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

      {(!isMobile || mobileView === 'hub') && (
        <Section label="Tipo de Fondo">
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 12,
              marginBottom: 4,
              scrollSnapType: 'x mandatory'
            }}
            className="hide-scrollbars"
          >
            {bgTypeCards.map((card: any) => {
              if (card.type === 'separator') {
                return (
                  <div key={card.id} style={{ width: 1.5, minHeight: 40, background: 'rgba(255,255,255,0.25)', margin: '0 12px', alignSelf: 'center', flexShrink: 0, opacity: 0.8 }} />
                );
              }
              const active = state.bgType === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    updateState({ bgType: card.id as any, bgImage: card.id !== 'image' ? state.bgImage : state.bgImage, bgVideo: card.id !== 'video' ? state.bgVideo : state.bgVideo });
                  }}
                  style={{
                    ...SWATCH_BTN(active),
                    scrollSnapAlign: 'start',
                    minWidth: 70
                  }}
                >
                  <div style={{
                    ...THUMB,
                    ...(card.preview || {}),
                    background: card.preview ? card.preview.background : (card.id === 'image' ? (state.bgImage ? `url(${state.bgImage})` : '#333') : (card.id === 'video' ? '#000' : 'transparent')),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {card.icon}
                  </div>
                  <span style={SWATCH_LABEL(active)}>{card.label}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Primary Contextual Options based on state.bgType */}
      {(!isMobile || mobileView === 'content') && (
        <div style={{ marginBottom: 20 }}>
          {state.bgType === 'solid' && (
            <Section label="Color Sólido">
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbars">
                {/* Custom Color Picker */}
                <div style={{
                  flexShrink: 0,
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'conic-gradient(#ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff00ff, #ff0000)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease'
                }} className="btn-press">
                  <Pipette size={20} color="#fff" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                  <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>

                {/* Sample Colors */}
                {SOLIDS.map(color => (
                  <button
                    key={color}
                    onClick={() => updateState({ bgColor: color })}
                    style={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: color,
                      border: state.bgColor === color ? '2px solid #fff' : '2px solid rgba(255,255,255,0.08)',
                      boxShadow: state.bgColor === color ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    className="btn-press"
                  />
                ))}
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

          {state.bgType === 'gradient-custom' && (
            <Section label="Pack de Gradientes">
              <div className="ps-responsive-list">
                {GRADIENT_ASSETS.map(g => {
                  const active = state.bgImage === g.url;
                  return (
                    <button key={g.id} onClick={() => updateState({ bgImage: g.url, bgVideo: null })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, backgroundImage: `url(${g.url})`, backgroundSize: 'cover', width: '100%', height: 60 }} />
                      <span style={SWATCH_LABEL(active)}>{g.id}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {state.bgType === 'texture' && (
            <Section label="Pack de Texturas">
              <div className="ps-responsive-list">
                {TEXTURE_ASSETS.map(t => {
                  const active = state.bgImage === t.url;
                  return (
                    <button key={t.id} onClick={() => updateState({ bgImage: t.url, bgVideo: null })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, backgroundImage: `url(${t.url})`, backgroundSize: 'cover', width: '100%', height: 60 }} />
                      <span style={SWATCH_LABEL(active)}>{t.id}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {state.bgType === 'wallpaper-custom' && (
            <Section label="Pack de Wallpapers">
              <div className="ps-responsive-list">
                {WALLPAPER_ASSETS.map(w => {
                  const active = state.bgImage === w.url;
                  return (
                    <button key={w.id} onClick={() => updateState({ bgImage: w.url, bgVideo: null })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, backgroundImage: `url(${w.url})`, backgroundSize: 'cover', width: '100%', height: 60 }} />
                      <span style={SWATCH_LABEL(active)}>{w.id}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {state.bgType === 'pattern' && (
            <Section label="Patrones">
              <div className="ps-responsive-list" style={{ marginBottom: 20 }}>
                {PATTERNS.map(p => {
                  const active = state.bgPattern === p.id;
                  return (
                    <button key={p.id} onClick={() => updateState({ bgPattern: p.id })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, ...p.bgStyle('#1a1c2e', state.bgPatternColor), width: '100%', height: 50, filter: state.bgPatternBlur > 0 ? `blur(${state.bgPatternBlur / 4}px)` : 'none' }} />
                      <span style={SWATCH_LABEL(active)}>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Pattern Color */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Color del Patrón</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, background: state.bgPatternColor, border: '1px solid rgba(255,255,255,0.2)' }}>
                      <input type="color" value={state.bgPatternColor.startsWith('#') ? state.bgPatternColor : '#ffffff'} onChange={e => updateState({ bgPatternColor: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    </div>
                    <input type="text" value={state.bgPatternColor} onChange={e => updateState({ bgPatternColor: e.target.value })} className="rt-input" style={{ flex: 1, height: 32, fontSize: 11, fontFamily: 'monospace' }} />
                  </div>
                </div>

                {/* Pattern Scale */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Escala</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{Math.round(state.bgPatternScale * 100)}%</span>
                  </div>
                  <input type="range" min={0.1} max={4} step={0.1} value={state.bgPatternScale}
                    onChange={e => updateState({ bgPatternScale: Number(e.target.value) })}
                    className="ms-range" />
                </div>

                {/* Pattern Opacity */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Opacidad</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{state.bgPatternOpacity}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1} value={state.bgPatternOpacity}
                    onChange={e => updateState({ bgPatternOpacity: Number(e.target.value) })}
                    className="ms-range" />
                </div>

                {/* Pattern Blur (The new addition) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Desenfoque (Blur)</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{state.bgPatternBlur}px</span>
                  </div>
                  <input type="range" min={0} max={40} step={1} value={state.bgPatternBlur}
                    onChange={e => updateState({ bgPatternBlur: Number(e.target.value) })}
                    className="ms-range" />
                </div>
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
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {state.bgImage && (
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.12)',
                    flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)'
                  }}>
                    <img src={state.bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="bg" />
                  </div>
                )}
                <button onClick={() => bgFileRef.current?.click()}
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.9)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}>
                  <ImageIcon size={14} />
                  {state.bgImage ? 'Cambiar Imagen' : 'Subir Imagen'}
                </button>
                {state.bgImage && (
                  <button
                    onClick={() => updateState({ bgImage: null })}
                    style={{
                      width: 32,
                      height: 50,
                      borderRadius: 10,
                      background: 'rgba(255,100,100,0.1)',
                      border: '1px solid rgba(255,100,100,0.2)',
                      color: 'rgba(255,150,150,0.8)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </div>
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
            {/* Global Sliders Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Opacity (Persistent) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opacidad Global</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{state.bgOpacity}%</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={state.bgOpacity}
                  onChange={e => updateState({ bgOpacity: Number(e.target.value) })}
                  className="ms-range" />
              </div>

              {/* Effects Hub (Toggles) */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[
                  { id: 'noise', label: 'Ruido', icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h.01M9 4h.01M14 4h.01M19 4h.01M4 9h.01M9 9h.01M14 9h.01M19 9h.01M4 14h.01M9 14h.01M14 14h.01M19 14h.01M4 19h.01M9 19h.01 M14 19h.01M19 19h.01" />
                    </svg>
                  ), active: state.grain, toggle: () => updateState({ grain: !state.grain, grainIntensity: state.grain ? 0 : 20, grainBgOnly: true }) },
                  { id: 'blur', label: 'Desenfoque', icon: <Droplet size={14} />, active: state.bgBlur > 0, toggle: () => updateState({ bgBlur: state.bgBlur > 0 ? 0 : 8 }) },
                  { id: 'vignette', label: 'Viñeta', icon: <Contrast size={14} />, active: state.bgVignette, toggle: () => updateState({ bgVignette: !state.bgVignette, bgVignetteIntensity: state.bgVignette ? 0 : 50 }) },
                ].map(effect => (
                  <button
                    key={effect.id}
                    onClick={effect.toggle}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 11, fontWeight: 700,
                      background: effect.active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                      color: effect.active ? '#fff' : 'rgba(255,255,255,0.4)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                    className="btn-press"
                  >
                    {effect.icon}
                    {effect.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Adjustments (Revealed on Toggle) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {state.grain && (
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ruido</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{state.grainIntensity}%</span>
                    </div>
                    <input type="range" min={1} max={100} step={1} value={state.grainIntensity}
                      onChange={e => updateState({ grainIntensity: Number(e.target.value) })}
                      className="ms-range" />
                  </div>
                )}

                {state.bgBlur > 0 && (
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Desenfoque</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{state.bgBlur}px</span>
                    </div>
                    <input type="range" min={1} max={40} step={1} value={state.bgBlur}
                      onChange={e => updateState({ bgBlur: Number(e.target.value) })}
                      className="ms-range" />
                  </div>
                )}

                {state.bgVignette && (
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Viñeta</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{state.bgVignetteIntensity}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={1} value={state.bgVignetteIntensity}
                      onChange={e => updateState({ bgVignetteIntensity: Number(e.target.value) })}
                      className="ms-range" />
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};
