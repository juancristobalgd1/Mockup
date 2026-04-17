import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { RefreshCw, RotateCcw, Maximize, Activity, Sparkles, Sun, Lamp, Layers } from 'lucide-react';
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

  const [envPopupOpen, setEnvPopupOpen] = useState(false);
  const [envPopupAnchor, setEnvPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const envPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (scenePopup && scenePopupRef.current && !scenePopupRef.current.contains(e.target as Node)) {
        setScenePopup(null);
      }
      if (lightPopupOpen && lightPopupRef.current && !lightPopupRef.current.contains(e.target as Node)) {
        setLightPopupOpen(false);
      }
      if (envPopupOpen && envPopupRef.current && !envPopupRef.current.contains(e.target as Node)) {
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

  const SceneBtn = ({ id, icon, label, sublabel, active, accent, onClick }: {
    id: string;
    icon: React.ReactNode; label: string; sublabel?: string; active?: boolean; accent?: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => {
    const isOpen = scenePopup === id || (id === 'estudio' && envPopupOpen) || (id === 'luz' && lightPopupOpen);
    
    return (
      <button
        title={label}
        onClick={onClick || (e => openScene(id as any, e))}
        style={{
          flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          background: isOpen ? 'rgba(255,255,255,0.18)' : active ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.5)',
          outline: isOpen
            ? '2px solid rgba(167,139,250,0.85)'
            : active ? '2px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.13)',
          color: isOpen ? 'rgba(167,139,250,1)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.12s',
          position: 'relative',
          overflow: 'hidden',
        }}>
        {/* Colorful accent background if active and not open */}
        {active && !isOpen && accent && (
          <div style={{
            position: 'absolute', inset: 0, background: accent, opacity: 0.15, pointerEvents: 'none'
          }} />
        )}
        
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20,
          color: isOpen ? 'rgba(167,139,250,1)' : active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
          transition: 'all 0.12s'
        }}>
          {icon}
        </div>
        
        <span style={{ 
          fontSize: 7, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase',
          lineHeight: 1, color: 'inherit', marginTop: 1
        }}>
          {sublabel || label}
        </span>
      </button>
    );
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="panel-text-contrast">
      <style>{`
        .scene-grid-cols-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 12px;
        }
      `}</style>

      {/* ── MOBILE VIEW: TIERED RENDERING ──────────────────────────────── */}
      {isMobile && (
        <div className="styled-scroll hide-scrollbars">
          {state.sceneSubTab === 'camera' && (
            <Section label="Lienzo y Cámara">
              <div style={{ marginBottom: 16 }}>
                <span style={POP_LABEL}>Proporción del Lienzo</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {CANVAS_RATIOS.map(r => (
                    <Chip key={r.id} active={state.canvasRatio === r.id}
                      onClick={() => updateState({ canvasRatio: r.id })}>{r.label}</Chip>
                  ))}
                </div>
              </div>
              <Slider label="Redondeado" value={state.canvasRadius ?? 0} min={0} max={80} step={2}
                onChange={v => updateState({ canvasRadius: v })} unit="px" />
            </Section>
          )}

          {state.sceneSubTab === 'motion' && (
            <Section label="Movimiento">
              <div style={ROW}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span style={ROW_LABEL}>Rotación Automática</span>
                </div>
                <Toggle enabled={state.autoRotate} onToggle={() => updateState({ autoRotate: !state.autoRotate })} />
              </div>
              {state.autoRotate && (
                <div style={{ marginTop: 6, marginBottom: 12 }}>
                  <Slider label="Velocidad de Giro" value={Math.round(state.autoRotateSpeed * 10) / 10}
                    min={0.5} max={8} step={0.5} onChange={v => updateState({ autoRotateSpeed: v })} />
                </div>
              )}
              <div style={DIVIDER} />
              <div style={ROW}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RotateCcw size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span style={ROW_LABEL}>Efecto Flotación</span>
                </div>
                <Toggle enabled={state.animation === 'float'}
                  onToggle={() => updateState({ animation: state.animation === 'float' ? 'none' : 'float' })} />
              </div>
            </Section>
          )}

          {state.sceneSubTab === 'effects' && (
            <Section label="Efectos de Escena">
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
                <div style={{ marginTop: 6, marginBottom: 12 }}>
                  <Slider label="Opacidad Reflejo" value={state.reflectionOpacity ?? 50} min={0} max={100}
                    onChange={v => updateState({ reflectionOpacity: v })} unit="%" />
                </div>
              )}
              <div style={DIVIDER} />
              <div style={ROW}>
                <span style={ROW_LABEL}>Ruido / Grano Cine</span>
                <Toggle enabled={state.grain ?? false}
                  onToggle={() => updateState({ grain: !(state.grain ?? false) })} />
              </div>
              {(state.grain ?? false) && (
                <div style={{ marginTop: 6 }}>
                  <Slider label="Grano" value={state.grainIntensity ?? 35} min={5} max={100}
                    onChange={v => updateState({ grainIntensity: v })} unit="%" />
                </div>
              )}
            </Section>
          )}



          {state.sceneSubTab === 'luz' && (
            <Section label="Iluminación Pro">
              <div className="scene-grid-cols-2">
                <MiniSlider label="Brillo" value={state.lightBrightness ?? 40} min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightBrightness: v })} />
                <MiniSlider label="Ambiente" value={state.lightAmbient ?? 45} min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightAmbient: v })} />
                <MiniSlider label="Calidez" value={state.lightWarmth ?? 0} min={-50} max={50} step={1} onChange={v => updateState({ lightWarmth: v })} />
                <MiniSlider label="Reflejos" value={state.lightIBL ?? 40} min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightIBL: v })} />
                <MiniSlider label="Exposición" value={Math.round((state.lightExposure ?? 1.0) * 100) / 100} min={0.4} max={2.0} step={0.05} onChange={v => updateState({ lightExposure: v })} />
                <MiniSlider label="Vignette" value={state.bloomIntensity ?? 22} min={0} max={100} step={1} unit="%" onChange={v => updateState({ bloomIntensity: v })} />
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={POP_LABEL}>Lente DSLR (Profundidad)</span>
                  <Toggle enabled={state.dofEnabled ?? false} onToggle={() => updateState({ dofEnabled: !(state.dofEnabled ?? false) })} />
                </div>
                {state.dofEnabled && (
                  <div className="scene-grid-cols-2">
                    <MiniSlider label="Enfoque" value={state.dofFocus ?? 10} min={0} max={20} step={1} unit="m" onChange={v => updateState({ dofFocus: v })} />
                    <MiniSlider label="Bokeh" value={(state.dofAperture ?? 0.02) * 1000} min={1} max={100} step={1} onChange={v => updateState({ dofAperture: v / 1000 })} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {state.sceneSubTab === 'estudio' && (
            <Section label="Entorno de Estudio">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={POP_LABEL}>Usar Iluminación IBL</span>
                <Toggle enabled={state.envEnabled !== false} onToggle={() => updateState({ envEnabled: state.envEnabled === false })} />
              </div>
              <div className="ps-responsive-list">
                {ENV_PRESETS.map(env => {
                  const active = state.envPreset === env.id;
                  return (
                    <button key={env.id} onClick={() => updateState({ envPreset: env.id })}
                      style={{
                        padding: '12px 6px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: active ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)',
                        outline: active ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                        {ENV_ICON[env.id as keyof typeof ENV_ICON] || <Sun size={20} />}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}>{env.label}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── DESKTOP VIEW: POPUP SYSTEM ────────────────────────────────── */}
      {!isMobile && (
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
              <div className="ps-responsive-list" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
                <SceneBtn id="canvas" label="Lienzo" sublabel="Lienzo" active={state.canvasRatio !== 'free' || (state.canvasRadius ?? 0) > 0} accent="rgba(59,130,246,1)"
                  icon={<Maximize size={15} strokeWidth={2.2} />} />
                <SceneBtn id="motion" label="Movimiento" sublabel="Anim" active={motionOn} accent="rgba(16,185,129,1)"
                  icon={<Activity size={15} strokeWidth={2.2} />} />
                <SceneBtn id="effects" label="Efectos" sublabel="FX" active={effectsOn} accent="rgba(244,114,182,1)"
                  icon={<Sparkles size={15} strokeWidth={2.2} />} />
              </div>

              <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0, margin: '0 1px' }} />

              {(() => {
                const activeEnv = ENV_PRESETS.find(e => e.id === state.envPreset) ?? ENV_PRESETS[0];
                const envOn = state.envEnabled !== false;
                return (
                  <SceneBtn 
                    id="estudio" 
                    label={`Entorno: ${activeEnv.label}`} 
                    sublabel="Estudio" 
                    active={envOn} 
                    accent="rgba(255,255,255,0.4)"
                    icon={ENV_ICON[activeEnv.id] || <Lamp size={15} strokeWidth={2.2} />}
                    onClick={(e) => {
                      if (envPopupOpen) { setEnvPopupOpen(false); return; }
                      const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      setEnvPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                      setEnvPopupOpen(true);
                    }}
                  />
                );
              })()}

              <SceneBtn 
                id="luz" 
                label="Controles de Luz" 
                sublabel="Luz" 
                active={true}
                icon={<Sun size={15} strokeWidth={2.2} />}
                onClick={(e) => {
                  if (lightPopupOpen) { setLightPopupOpen(false); return; }
                  const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setLightPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                  setLightPopupOpen(true);
                }}
              />
            </div>
          </Section>
        </>
      )}
    </div>
  );
};
