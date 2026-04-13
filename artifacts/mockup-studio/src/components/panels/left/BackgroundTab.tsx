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

export const BackgroundTab = () => {
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
    { id: 'none', label: 'None', preview: { background: '#111113' }, icon:
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
          <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    },
    { id: 'solid', label: 'Solid', preview: { background: state.bgType === 'solid' ? state.bgColor : '#374151' } },
    { id: 'gradient', label: 'Gradient', preview: { background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)' } },
    { id: 'mesh', label: 'Mesh', preview: { background: 'radial-gradient(at 30% 20%, #0ea5e9 0px, transparent 55%), radial-gradient(at 80% 70%, #ec4899 0px, transparent 55%), #03111e' } },
    { id: 'wallpaper', label: 'Wallpaper', preview: { background: 'radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #60a5fa 60%, #dbeafe 100%)' } },
    { id: 'pattern', label: 'Pattern', preview: { backgroundColor: '#1a1c2e', backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '10px 10px' } },
    { id: 'image', label: 'Image', preview: null },
    { id: 'video', label: 'Video', preview: null, icon: <Video size={16} color="rgba(255,255,255,0.40)" /> },
    { id: 'transparent', label: 'Alpha', preview: null, icon:
        <div style={{
          width: '100%', height: '100%', borderRadius: 10,
          backgroundImage: 'linear-gradient(45deg, #3a3a3a 25%, transparent 25%), linear-gradient(-45deg, #3a3a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3a3a3a 75%), linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          backgroundColor: '#222',
        }} />
    },
    { id: 'animated', label: 'Animated', preview: null, icon:
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

  const GRID4: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
  };

  return (
    <>
      <style>{ANIMATED_BG_KEYFRAMES}</style>

      {bgPopup && bgPopupAnchor && (
        <div ref={bgPopupRef} style={popupStyle}>
          {bgPopup === 'opacity' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Opacity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <input
                  type="range" min={0} max={100} step={1}
                  value={state.bgOpacity ?? 100}
                  onChange={e => updateState({ bgOpacity: Number(e.target.value) })}
                  className="rt-slider"
                  style={{ flex: 1, accentColor: 'rgba(255,255,255,0.7)' }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', minWidth: 34, textAlign: 'right' }}>
                  {state.bgOpacity ?? 100}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[20, 40, 60, 80, 100].map(v => (
                  <button key={v} onClick={() => updateState({ bgOpacity: v })}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                      background: (state.bgOpacity ?? 100) === v ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                      color: (state.bgOpacity ?? 100) === v ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                      outline: (state.bgOpacity ?? 100) === v ? '1.5px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.1s',
                    }}>{v}%</button>
                ))}
              </div>
            </>
          )}

          {bgPopup === 'solid' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Color</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
                <input type="text" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                  className="rt-input" style={{ fontFamily: 'monospace', flex: 1 }} />
              </div>
            </>
          )}

          {bgPopup === 'gradient' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gradients</div>
              <div style={GRID4}>
                {GRADIENTS.map(g => {
                  const active = state.bgColor === g.id;
                  return (
                    <button key={g.id} onClick={() => updateState({ bgColor: g.id })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, background: g.css }} />
                      <span style={SWATCH_LABEL(active)}>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {bgPopup === 'mesh' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mesh Gradients</span>
                {state.screenshotUrl && (
                  <button onClick={() => { handleAutoBackground(); setBgPopup(null); }} disabled={extracting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7,
                      fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                    }}>
                    <Wand2 size={10} />{extracting ? 'Extracting…' : 'Auto'}
                  </button>
                )}
              </div>
              <div style={GRID4}>
                {MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => {
                  const active = state.bgColor === m.id;
                  return (
                    <button key={m.id} onClick={() => updateState({ bgColor: m.id })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, background: m.css }} />
                      <span style={SWATCH_LABEL(active)}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {bgPopup === 'wallpaper' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Wallpapers</div>
              <div style={GRID4}>
                {WALLPAPERS.map(w => {
                  const active = state.bgColor === w.id;
                  return (
                    <button key={w.id} onClick={() => updateState({ bgColor: w.id })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, background: w.css }} />
                      <span style={SWATCH_LABEL(active)}>{w.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {bgPopup === 'pattern' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pattern</div>
              <div style={GRID4}>
                {PATTERNS.map(p => {
                  const active = state.bgPattern === p.id;
                  return (
                    <button key={p.id} onClick={() => updateState({ bgPattern: p.id })} style={SWATCH_BTN(active)}>
                      <div style={{ ...THUMB, ...p.bgStyle('#1a1c2e') }} />
                      <span style={SWATCH_LABEL(active)}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pattern Color</div>
                <div style={{ position: 'relative', width: '100%', height: 36, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
              </div>
            </>
          )}

          {bgPopup === 'animated' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Animated Backgrounds
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {ANIMATED_BACKGROUNDS.map(bg => {
                  const active = state.bgAnimated === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => updateState({ bgAnimated: bg.id })}
                      title={bg.label}
                      style={{
                        position: 'relative', border: 'none', padding: 0,
                        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                        outline: active ? '2.5px solid rgba(167,139,250,0.9)' : '1.5px solid rgba(255,255,255,0.1)',
                        outlineOffset: active ? 1 : 0,
                        transition: 'outline 0.1s',
                      }}
                    >
                      <div style={{
                        width: '100%', aspectRatio: '16/9',
                        ...bg.thumb,
                        display: 'flex', alignItems: 'flex-end',
                      }}>
                        {bg.type === 'iframe' && (
                          <div style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(0,0,0,0.5)', borderRadius: 4,
                            fontSize: 8, color: 'rgba(255,255,255,0.7)', padding: '1px 4px',
                            fontWeight: 700, letterSpacing: '0.05em',
                          }}>3D</div>
                        )}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                        padding: '10px 7px 5px',
                        fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
                        textAlign: 'left',
                      }}>
                        {bg.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {bgPopup === 'image' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Background Image</div>
              {state.bgImage && (
                <div style={{ width: '100%', height: 80, borderRadius: 10, overflow: 'hidden', marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={state.bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="bg" />
                </div>
              )}
              <button onClick={() => bgFileRef.current?.click()}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: 'rgba(0,0,0,0.5)', border: '1px dashed rgba(255,255,255,0.28)',
                  color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                }}>
                {state.bgImage ? 'Change Image' : '+ Upload Image'}
              </button>
              <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleBgImage(e); setBgPopup(null); }} />
            </>
          )}

          {bgPopup === 'video' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Background Video</div>
              {state.bgVideo && (
                <div style={{ width: '100%', height: 92, borderRadius: 10, overflow: 'hidden', marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0f1115' }}>
                  <video src={state.bgVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop playsInline />
                </div>
              )}
              <button onClick={() => bgVideoFileRef.current?.click()}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: 'rgba(0,0,0,0.5)', border: '1px dashed rgba(255,255,255,0.28)',
                  color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                }}>
                {state.bgVideo ? 'Change Video' : '+ Upload Video'}
              </button>
              <input ref={bgVideoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { handleBgVideo(e); setBgPopup(null); }} />
            </>
          )}

          {bgPopup === 'effects' && (() => {
            const EffectRow = ({ label, active, onToggle, children }: { label: string; active: boolean; onToggle: () => void; children?: React.ReactNode }) => (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: active ? 10 : 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <button onClick={onToggle} style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.12)',
                    position: 'relative', transition: 'all 0.18s', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: active ? 18 : 2, width: 16, height: 16,
                      borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
                {active && children}
              </div>
            );

            const SliderRow = ({ value, min, max, step, onChange, unit }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string }) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => onChange(Number(e.target.value))}
                  className="rt-slider" style={{ flex: 1, accentColor: 'rgba(167,139,250,0.9)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'right' }}>
                  {value}{unit ?? ''}
                </span>
              </div>
            );

            return (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Effects</div>

                <EffectRow label="Blur" active={state.bgBlur > 0} onToggle={() => updateState({ bgBlur: state.bgBlur > 0 ? 0 : 8 })}>
                  <SliderRow value={state.bgBlur} min={1} max={24} step={1} unit="px"
                    onChange={v => updateState({ bgBlur: v })} />
                </EffectRow>

                <EffectRow label="Noise" active={state.grain} onToggle={() => updateState({ grain: !state.grain })}>
                  <SliderRow value={state.grainIntensity} min={5} max={100} step={1} unit="%"
                    onChange={v => updateState({ grainIntensity: v })} />
                </EffectRow>

                <EffectRow label="Vignette" active={state.bgVignette} onToggle={() => updateState({ bgVignette: !state.bgVignette })}>
                  <SliderRow value={state.bgVignetteIntensity} min={10} max={100} step={1} unit="%"
                    onChange={v => updateState({ bgVignetteIntensity: v })} />
                </EffectRow>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 2,
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: state.grainBgOnly ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>
                      Background only
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                      Noise doesn't cover the device
                    </div>
                  </div>
                  <button
                    onClick={() => updateState({ grainBgOnly: !state.grainBgOnly })}
                    style={{
                      width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: state.grainBgOnly ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.12)',
                      position: 'relative', transition: 'all 0.18s', flexShrink: 0,
                    }}>
                    <div style={{
                      position: 'absolute', top: 3, left: state.grainBgOnly ? 19 : 3, width: 16, height: 16,
                      borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <Section label="Background" action={
        <button onClick={handleShuffle} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
          fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
          transition: 'all 0.12s',
        }}>
          <Shuffle size={10} /> Shuffle
        </button>
      }>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
          {bgTypeCards.map(({ id, label, preview, icon }) => {
            const active = state.bgType === id;
            const popupOpen = bgPopup === id;
            const hasPopup = !NO_POPUP_TYPES.has(id);
            return (
              <button key={id}
                onClick={e => {
                  updateState({ bgType: id as any });
                  if (!hasPopup) { setBgPopup(null); return; }
                  if (popupOpen) { setBgPopup(null); return; }
                  const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setBgPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                  setBgPopup(id);
                }}
                title={label}
                style={{
                  flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                  outline: popupOpen ? '2px solid rgba(167,139,250,0.8)' : active ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.14)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  ...(icon ? {} : (preview ?? { background: '#1a1c2e' })),
                }}>
                {icon
                  ? icon
                  : (!preview && id !== 'none' && <ImageIcon size={16} color="rgba(255,255,255,0.40)" />)}
              </button>
            );
          })}

          {state.bgType !== 'none' && state.bgType !== 'transparent' && (
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.10)', flexShrink: 0, alignSelf: 'center' }} />
          )}

          {state.bgType !== 'none' && state.bgType !== 'transparent' && (() => {
            const opacityOpen = bgPopup === 'opacity';
            const isModified = (state.bgOpacity ?? 100) < 100;
            return (
              <button
                title="Opacity"
                onClick={e => {
                  if (opacityOpen) { setBgPopup(null); return; }
                  const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setBgPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                  setBgPopup('opacity');
                }}
                style={{
                  flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  background: opacityOpen ? 'rgba(255,255,255,0.15)' : isModified ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                  outline: opacityOpen ? '2px solid rgba(167,139,250,0.8)' : isModified ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.14)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  color: opacityOpen ? 'rgba(167,139,250,1)' : isModified ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" stroke="none" opacity="0.5"/>
                </svg>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1 }}>
                  {state.bgOpacity ?? 100}%
                </span>
              </button>
            );
          })()}

          {state.bgType !== 'none' && state.bgType !== 'transparent' && (() => {
            const effectsOpen = bgPopup === 'effects';
            const hasEffect = state.bgBlur > 0 || state.grain || state.bgVignette;
            return (
              <button
                title="Effects"
                onClick={e => {
                  if (effectsOpen) { setBgPopup(null); return; }
                  const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setBgPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                  setBgPopup('effects');
                }}
                style={{
                  flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  background: effectsOpen ? 'rgba(167,139,250,0.18)' : hasEffect ? 'rgba(167,139,250,0.18)' : 'rgba(0,0,0,0.5)',
                  outline: effectsOpen ? '2px solid rgba(167,139,250,0.8)' : hasEffect ? '2px solid rgba(167,139,250,0.6)' : '1.5px solid rgba(255,255,255,0.14)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  color: effectsOpen ? 'rgba(167,139,250,1)' : hasEffect ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.4)',
                }}>
                <Sparkles size={14} />
                <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1 }}>FX</span>
              </button>
            );
          })()}
        </div>
      </Section>
    </>
  );
};
