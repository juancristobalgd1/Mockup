import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, ChevronDown, Volume2, VolumeX, Music, List } from 'lucide-react';
import { useApp } from '../../store';
import { ANIMATION_PRESETS, ANIMATION_TEMPLATES } from './timelineAnimations';
import { PRESET_PREVIEW_KEYFRAMES, PresetPreview, TemplatePreview } from './AnimationPreviews';

// Dropdown with the soundtrack picker, camera presets and multi-scene templates.
export function TimelineOptionsMenu({ onApplyPreset, onApplyTemplate }: {
  onApplyPreset: (presetId: string) => void;
  onApplyTemplate: (templateId: string) => void;
}) {
  const { state, updateState } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const audioFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = () => setShowMenu(false);
    if (showMenu) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showMenu]);

  const handleAudioFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (state.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(state.audioUrl);
    const url = URL.createObjectURL(file);
    updateState({ audioUrl: url });
    e.target.value = '';
  }, [state.audioUrl, updateState]);

  const apply = (handler: (id: string) => void, id: string) => {
    setShowMenu(false);
    handler(id);
  };

  return (
    <>
    <style>{PRESET_PREVIEW_KEYFRAMES}</style>
    <div style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
        title="Opciones de animación y audio"
        style={{
          background: showMenu ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${showMenu ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 6, height: 28, width: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          color: 'rgba(255,255,255,0.7)', transition: 'all 0.15s',
        }}
      >
        <List size={14} />
        <ChevronDown size={10} style={{ transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.5 }} />
      </button>

      {showMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
            background: '#1a1c1e', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12, overflow: 'hidden', zIndex: 100,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 'min(500px, 70vh)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* ── Actions & Audio ── */}
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Configuración de Audio
            </span>

            {/* Audio Controls inside menu */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '10px'
            }}>
              <input ref={audioFileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioFile} />
              {state.audioUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80' }}>
                      <Music size={12} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>Audio activo</span>
                    </div>
                    <button
                      onClick={() => updateState({ audioUrl: null })}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <VolumeX size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      type="range" min={0} max={100} step={5}
                      value={state.audioVolume ?? 80}
                      onChange={e => updateState({ audioVolume: Number(e.target.value) })}
                      style={{ flex: 1, height: 4, accentColor: '#4ade80', cursor: 'pointer' }}
                    />
                    <Volume2 size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => audioFileRef.current?.click()}
                  style={{
                    width: '100%', background: 'none', border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 6, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600,
                  }}
                >
                  <Music size={12} />
                  Añadir Soundtrack
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '8px 12px 4px' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Presets de animación
              </span>
            </div>
            {ANIMATION_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => apply(onApplyPreset, preset.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.12s', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <PresetPreview presetId={preset.id} />
                <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', fontWeight: 700, lineHeight: 1.2 }}>{preset.label}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>{preset.desc}</span>
                  <span style={{ fontSize: 9, color: 'rgba(167,139,250,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 3 }}>
                    Vista previa
                  </span>
                </div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <Plus size={18} />
                </div>
              </button>
            ))}

            {/* Templates section */}
            <div style={{ padding: '6px 10px 4px', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Templates completos
              </span>
            </div>
            {ANIMATION_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => apply(onApplyTemplate, tpl.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.12s', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <TemplatePreview templateId={tpl.id} />
                <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', fontWeight: 700, lineHeight: 1.2 }}>{tpl.label}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>{tpl.desc}</span>
                  <span style={{ fontSize: 9, color: 'rgba(59,130,246,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 3 }}>
                    {tpl.duration}s · Template
                  </span>
                </div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <Plus size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
