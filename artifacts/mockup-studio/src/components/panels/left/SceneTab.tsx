import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { useApp } from '../../../store';
import { Section, Chip, Slider, MiniSlider, Toggle } from '../../ui/PanelUI';
import { CANVAS_RATIOS, ENV_PRESETS } from '../../../data/panelConstants';
import { ENV_ICON } from '../../../data/envIcons';
import { clampL, safeW } from '../../../utils/panelUtils';

export const SceneTab = () => {
  const { state, updateState } = useApp();

  const [scenePopup, setScenePopup] = useState<null | 'canvas' | 'motion' | 'effects' | 'shadow'>(null);
  const [scenePopupAnchor, setScenePopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const scenePopupRef = useRef<HTMLDivElement>(null);

  const [lightPopupOpen, setLightPopupOpen] = useState(false);
  const [lightPopupAnchor, setLightPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const lightPopupRef = useRef<HTMLDivElement>(null);
  const lightBtnRef = useRef<HTMLButtonElement>(null);

  const [envPopupOpen, setEnvPopupOpen] = useState(false);
  const [envPopupAnchor, setEnvPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const envPopupRef = useRef<HTMLDivElement>(null);
  const envBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (scenePopup && scenePopupRef.current && !scenePopupRef.current.contains(e.target as Node)) {
        setScenePopup(null);
      }
      if (lightPopupOpen && lightPopupRef.current && !lightPopupRef.current.contains(e.target as Node)
          && lightBtnRef.current && !lightBtnRef.current.contains(e.target as Node)) {
        setLightPopupOpen(false);
      }
      if (envPopupOpen && envPopupRef.current && !envPopupRef.current.contains(e.target as Node)
          && envBtnRef.current && !envBtnRef.current.contains(e.target as Node)) {
        setEnvPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [scenePopup, lightPopupOpen, envPopupOpen]);

  const openScene = (id: 'canvas' | 'motion' | 'effects' | 'shadow', e: React.MouseEvent) => {
    if (scenePopup === id) { setScenePopup(null); return; }
    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    setScenePopupAnchor({ x: r.left + r.width / 2, y: r.top });
    setScenePopup(id);
  };

  const POPUP_BASE: React.CSSProperties = {
    position: 'fixed',
    left: scenePopupAnchor ? clampL(scenePopupAnchor.x, 262, -130) : 0,
    bottom: scenePopupAnchor ? window.innerHeight - scenePopupAnchor.y + 8 : 0,
    width: safeW(262),
    maxHeight: 'min(500px, calc(100vh - 80px))',
    overflowY: 'auto',
    background: 'rgba(18,20,26,0.98)',
    borderRadius: 18, padding: '14px 16px', zIndex: 9999,
    boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(22px)',
  };

  const POP_LABEL: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
  };

  const ROW: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '5px 0',
  };

  const ROW_LABEL: React.CSSProperties = {
    fontSize: 11, color: 'rgba(255,255,255,0.55)',
  };

  const DIVIDER: React.CSSProperties = {
    borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0',
  };

  const motionOn  = state.autoRotate || state.animation === 'float';
  const effectsOn = (state.reflection ?? false) || (state.grain ?? false) || (state.glassReflection ?? true);
  const shadowPct = state.contactShadowOpacity;

  const SceneBtn = ({ id, icon, label, active, accent }: {
    id: 'canvas' | 'motion' | 'effects' | 'shadow';
    icon: React.ReactNode; label: string; active?: boolean; accent: string;
  }) => (
    <button
      title={label}
      onClick={e => openScene(id, e)}
      style={{
        flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: scenePopup === id ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)',
        outline: scenePopup === id
          ? '2px solid rgba(167,139,250,0.8)'
          : active ? '2px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.13)',
        color: scenePopup === id ? 'rgba(167,139,250,1)' : active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
        transition: 'all 0.12s',
      }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: scenePopup === id
          ? 'rgba(167,139,250,0.18)'
          : active ? accent : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 12px rgba(0,0,0,0.18)'
          : 'inset 0 1px 0 rgba(255,255,255,0.08)',
        transition: 'all 0.12s',
      }}>
        {icon}
      </div>
    </button>
  );

  return (
    <>
      {scenePopup && scenePopupAnchor && (
        <div ref={scenePopupRef} style={POPUP_BASE}>
          {scenePopup === 'canvas' && (
            <>
              <div style={POP_LABEL}>Lienzo</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                {CANVAS_RATIOS.map(r => (
                  <Chip key={r.id} active={state.canvasRatio === r.id}
                    onClick={() => updateState({ canvasRatio: r.id })}>{r.label}</Chip>
                ))}
              </div>
              <Slider label="Radio de Borde" value={state.canvasRadius ?? 0} min={0} max={80} step={2}
                onChange={v => updateState({ canvasRadius: v })} unit="px" />
            </>
          )}

          {scenePopup === 'motion' && (
            <>
              <div style={POP_LABEL}>Dispositivo y Animación</div>
              <div style={ROW}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span style={ROW_LABEL}>Rotación Auto</span>
                </div>
                <Toggle enabled={state.autoRotate} onToggle={() => updateState({ autoRotate: !state.autoRotate })} />
              </div>
              {state.autoRotate && (
                <div style={{ marginTop: 6 }}>
                  <Slider label="Velocidad" value={Math.round(state.autoRotateSpeed * 10) / 10}
                    min={0.5} max={8} step={0.5} onChange={v => updateState({ autoRotateSpeed: v })} />
                </div>
              )}
              <div style={DIVIDER} />
              <div style={ROW}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RotateCcw size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span style={ROW_LABEL}>Flotación</span>
                </div>
                <Toggle enabled={state.animation === 'float'}
                  onToggle={() => updateState({ animation: state.animation === 'float' ? 'none' : 'float' })} />
              </div>
            </>
          )}

          {scenePopup === 'effects' && (
            <>
              <div style={POP_LABEL}>Efectos</div>
              <div style={ROW}>
                <span style={ROW_LABEL}>Reflejo de Cristal</span>
                <Toggle enabled={state.glassReflection ?? true}
                  onToggle={() => updateState({ glassReflection: !(state.glassReflection ?? true) })} />
              </div>
              <div style={DIVIDER} />
              <div style={ROW}>
                <span style={ROW_LABEL}>Reflejo de Suelo</span>
                <Toggle enabled={state.reflection ?? false}
                  onToggle={() => updateState({ reflection: !(state.reflection ?? false) })} />
              </div>
              {(state.reflection ?? false) && (
                <div style={{ marginTop: 6 }}>
                  <Slider label="Fuerza" value={state.reflectionOpacity ?? 50} min={0} max={100}
                    onChange={v => updateState({ reflectionOpacity: v })} unit="%" />
                </div>
              )}
              <div style={DIVIDER} />
              <div style={ROW}>
                <span style={ROW_LABEL}>Grano</span>
                <Toggle enabled={state.grain ?? false}
                  onToggle={() => updateState({ grain: !(state.grain ?? false) })} />
              </div>
              {(state.grain ?? false) && (
                <div style={{ marginTop: 6 }}>
                  <Slider label="Intensidad" value={state.grainIntensity ?? 35} min={5} max={100}
                    onChange={v => updateState({ grainIntensity: v })} unit="%" />
                </div>
              )}
            </>
          )}

          {scenePopup === 'shadow' && (
            <>
              <div style={POP_LABEL}>Sombra</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 8 }}>
                  {(['abajo', 'atras', 'izquierda', 'derecha'] as const).map(dir => (
                    <button key={dir}
                      onClick={() => updateState({ contactShadowDirection: dir })}
                      style={{
                        flex: 1, height: 24, fontSize: 10, fontWeight: 700,
                        textTransform: 'capitalize',
                        borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: (state.contactShadowDirection || 'atras') === dir ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: (state.contactShadowDirection || 'atras') === dir ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.15s'
                      }}>
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="Intensidad" value={state.contactShadowOpacity} min={0} max={100}
                onChange={v => updateState({ contactShadowOpacity: v })} unit="%" />
            </>
          )}
        </div>
      )}

      {/* Lighting popup */}
      {lightPopupOpen && lightPopupAnchor && (
        <div ref={lightPopupRef} style={{
          position: 'fixed',
          left: clampL(lightPopupAnchor.x, 262, -130),
          bottom: window.innerHeight - lightPopupAnchor.y + 8,
          width: safeW(262),
          maxHeight: 'min(500px, calc(100vh - 80px))',
          overflowY: 'auto',
          background: 'rgba(18,20,26,0.98)',
          borderRadius: 18, padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.80), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(22px)',
        }}>
          <div style={POP_LABEL}>Controles de Luz</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
            <MiniSlider label="Brillo" value={state.lightBrightness ?? 40} min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightBrightness: v })} />
            <MiniSlider label="Ambiente"    value={state.lightAmbient ?? 45}    min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightAmbient: v })} />
            <MiniSlider label="Calidez"     value={state.lightWarmth ?? 0}      min={-50} max={50} step={1}      onChange={v => updateState({ lightWarmth: v })} />
            <MiniSlider label="Reflejos" value={state.lightIBL ?? 40}       min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightIBL: v })} />
            <MiniSlider label="Exposición"   value={Math.round((state.lightExposure ?? 1.0) * 100) / 100} min={0.4} max={2.0} step={0.05} onChange={v => updateState({ lightExposure: v })} />
            <MiniSlider label="Resplandor"      value={state.bloomIntensity ?? 22}  min={0} max={100} step={1} unit="%" onChange={v => updateState({ bloomIntensity: v })} />
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={POP_LABEL}>Lente DSLR</span>
              <button
                onClick={() => updateState({ dofEnabled: !(state.dofEnabled ?? false) })}
                style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: (state.dofEnabled ?? false) ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)',
                  color: (state.dofEnabled ?? false) ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                  transition: 'background 0.2s',
                }}>
                {(state.dofEnabled ?? false) ? 'ON' : 'OFF'}
              </button>
            </div>
            {state.dofEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
                <MiniSlider label="Enfoque" value={state.dofFocus ?? 10} min={0} max={20} step={1} unit="m" onChange={v => updateState({ dofFocus: v })} />
                <MiniSlider label="Apertura" value={(state.dofAperture ?? 0.02) * 1000} min={1} max={100} step={1} onChange={v => updateState({ dofAperture: v / 1000 })} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Environment popup */}
      {envPopupOpen && envPopupAnchor && (
        <div ref={envPopupRef} style={{
          position: 'fixed',
          left: clampL(envPopupAnchor.x, 262, -130),
          bottom: window.innerHeight - envPopupAnchor.y + 8,
          width: safeW(262),
          background: 'rgba(18,20,26,0.98)',
          borderRadius: 18, padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.80), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(22px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={POP_LABEL}>Entorno</span>
            <Toggle enabled={state.envEnabled !== false} onToggle={() => updateState({ envEnabled: state.envEnabled === false })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {ENV_PRESETS.map(env => {
              const active = state.envPreset === env.id;
              return (
                <button key={env.id} onClick={() => updateState({ envPreset: env.id })}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 4px',
                    borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    outline: active ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' }}>{ENV_ICON[env.id]}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{env.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Section label="Escena">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <SceneBtn id="canvas" label="Lienzo" active={state.canvasRatio !== 'free' || (state.canvasRadius ?? 0) > 0} accent="linear-gradient(135deg, rgba(59,130,246,0.32), rgba(14,165,233,0.22))"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M8 9h8M8 13h4" opacity="0.9"/></svg>} />
            <SceneBtn id="motion" label="Movimiento" active={motionOn} accent="linear-gradient(135deg, rgba(16,185,129,0.3), rgba(34,197,94,0.2))"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15c2.5-4 5.5-6 9-6 2.8 0 5 .9 7 2.6"/><path d="M14.5 6.5 20 11l-5.5 4.5"/></svg>} />
            <SceneBtn id="effects" label="Efectos" active={effectsOn} accent="linear-gradient(135deg, rgba(244,114,182,0.3), rgba(168,85,247,0.2))"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5 14.1 9l5.9 2.1-5.9 2.1L12 18.5l-2.1-5.3L4 11.1 9.9 9 12 3.5Z"/><circle cx="18.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/></svg>} />
            <SceneBtn id="shadow" label="Sombra" active={(shadowPct ?? 0) > 0} accent="linear-gradient(135deg, rgba(99,102,241,0.3), rgba(71,85,105,0.22))"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11.5c0-2.8 2.2-5 5-5 1.9 0 3.6 1 4.5 2.6"/><path d="M6 16.5c1.8-1.2 3.9-1.8 6-1.8 2.4 0 4.5.6 6.4 1.8" opacity="0.95"/><ellipse cx="12" cy="18.3" rx="7" ry="2.2" opacity="0.7"/></svg>} />
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

          {(() => {
            const activeEnv = ENV_PRESETS.find(e => e.id === state.envPreset) ?? ENV_PRESETS[0];
            const envOn = state.envEnabled !== false;
            return (
              <button
                ref={envBtnRef}
                title={`Entorno: ${activeEnv.label}`}
                onClick={() => {
                  if (envPopupOpen) { setEnvPopupOpen(false); return; }
                  const r = envBtnRef.current?.getBoundingClientRect();
                  if (r) setEnvPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                  setEnvPopupOpen(true);
                }}
                style={{
                  flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  background: envPopupOpen ? 'rgba(255,255,255,0.18)' : envOn ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
                  outline: envPopupOpen
                    ? '2px solid rgba(167,139,250,0.85)'
                    : envOn ? '2px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.14)',
                  color: envPopupOpen ? 'rgba(167,139,250,1)' : envOn ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.3)',
                  opacity: envOn ? 1 : 0.5,
                  transition: 'all 0.12s',
                }}>
                {ENV_ICON[activeEnv.id]}
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1, color: 'inherit' }}>
                  {activeEnv.label.toUpperCase()}
                </span>
              </button>
            );
          })()}

          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

          <button
            ref={lightBtnRef}
            onClick={() => {
              if (lightPopupOpen) { setLightPopupOpen(false); return; }
              const r = lightBtnRef.current?.getBoundingClientRect();
              if (r) setLightPopupAnchor({ x: r.left + r.width / 2, y: r.top });
              setLightPopupOpen(true);
            }}
            title="Controles de Luz"
            style={{
              flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              background: lightPopupOpen ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
              outline: lightPopupOpen ? '2px solid rgba(167,139,250,0.85)' : '1px solid rgba(255,255,255,0.14)',
              color: lightPopupOpen ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.14s',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1, color: 'inherit' }}>LUZ</span>
          </button>
        </div>
      </Section>
    </>
  );
};
