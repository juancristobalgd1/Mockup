import * as React from 'react';
import { useState } from 'react';
import { 
  Plus, Trash2, MapPin, Settings2, Palette, 
  MousePointer2 
} from 'lucide-react';
import { useApp } from '../../../store';
import { Section, Chip, Slider, Toggle } from '../../ui/PanelUI';
import type { LabelAnchorPosition, TextOverlay, AppState } from '../../../store';

const LABEL_MODES = [
  { id: 'follow', label: 'Seguir Cámara' },
  { id: 'billboard', label: 'Cartelera' },
  { id: 'fixed', label: 'Fijo al Modelo' },
] as const;

const LABEL_POSITIONS: { id: LabelAnchorPosition; left: string; top: string }[] = [
  { id: 'top', left: '50%', top: '10%' },
  { id: 'top-right', left: '62%', top: '22%' },
  { id: 'right', left: '68%', top: '50%' },
  { id: 'bottom-right', left: '62%', top: '78%' },
  { id: 'bottom', left: '50%', top: '90%' },
  { id: 'bottom-left', left: '38%', top: '78%' },
  { id: 'left', left: '32%', top: '50%' },
  { id: 'top-left', left: '38%', top: '22%' },
];

const FONTS = ['Inter', 'Roboto', 'Arial', 'Georgia', 'Courier New', 'Times New Roman'];

const DeviceSilhouette = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    position: 'relative', height: 260, borderRadius: 24, 
    background: '#09090b', 
    border: '1px solid rgba(255,255,255,0.08)', 
    marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.9)'
  }}>
    <div style={{ 
      position: 'absolute', inset: 0, opacity: 0.08, 
      backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)', 
      backgroundSize: '30px 30px' 
    }} />
    <div style={{ 
      width: 70, height: 140, borderRadius: 16, 
      border: '3px solid rgba(255,255,255,0.15)', 
      background: 'rgba(255,255,255,0.03)',
      boxShadow: '0 0 50px rgba(0,0,0,0.7)',
      position: 'relative', zIndex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '85%', height: '90%', borderRadius: 10, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }} />
    </div>
    {children}
  </div>
);

export const LabelsTab = () => {
  const { state, updateState, addLabel, clearLabels, updateText, removeText } = useApp();
  const [lTab, setLTab] = useState<'positions' | 'behavior' | 'style'>('positions');
  const isMobile = window.innerWidth <= 768;
  
  const activeLabels = state.texts.filter(text => text.kind === 'label');
  const selectedLabel = activeLabels.find(l => l.id === state.activeLabelId);

  const TABS = [
    { id: 'positions' as const, label: 'Posición', icon: MapPin },
    { id: 'behavior'  as const, label: 'Conducta', icon: Settings2 },
    { id: 'style'     as const, label: 'Estilo', icon: Palette },
  ];

  const FIXED_POSITIONS: Record<string, { x: number; y: number }> = {
    'top': { x: 50, y: 16 },
    'top-right': { x: 78, y: 20 },
    'right': { x: 84, y: 50 },
    'bottom-right': { x: 78, y: 80 },
    'bottom': { x: 50, y: 84 },
    'bottom-left': { x: 22, y: 80 },
    'left': { x: 16, y: 50 },
    'top-left': { x: 22, y: 20 },
  };

  const handleUpdate = (updates: any) => {
    if (selectedLabel) {
      if (updates.labelMode === 'fixed' && (selectedLabel.labelMode !== 'fixed')) {
        const anchor = selectedLabel.labelAnchor || 'right';
        const pos = FIXED_POSITIONS[anchor];
        updates.x = pos.x;
        updates.y = pos.y;
      }
      updateText(selectedLabel.id, updates);
    } else {
      updateState(updates);
    }
  };

  const getCurrentValue = (key: keyof TextOverlay | keyof AppState, draftKey: keyof AppState) => {
    if (selectedLabel && key in selectedLabel) return (selectedLabel as any)[key];
    return (state as any)[draftKey];
  };

  return (
    <div className="panel-text-contrast">
      <style>{`
        .labels-mobile-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        .label-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .label-pill.active {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.4);
        }
      `}</style>

      {/* ── MOBILE DRILL-DOWN VIEW ──────────────────────────────────── */}
      {isMobile && (
        <div className="hide-scrollbars" style={{ overflowY: 'auto' }}>
          {state.labelsSubTab === 'add' && (
            <Section label="Puntos de Anclaje">
              <DeviceSilhouette>
                {LABEL_POSITIONS.map(pos => (
                  <button key={pos.id} 
                    onClick={() => { addLabel(pos.id); updateState({ labelsSubTab: 'view' }); }} 
                    style={{ 
                      position: 'absolute', left: pos.left, top: pos.top, 
                      transform: 'translate(-50%,-50%)', width: 28, height: 28, 
                      borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', 
                      background: 'rgba(255,255,255,0.15)', color: '#fff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', zIndex: 2, backdropFilter: 'blur(8px)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                    }}
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                ))}
              </DeviceSilhouette>
            </Section>
          )}

          {state.labelsSubTab === 'view' && (
            <>
              {activeLabels.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <MousePointer2 size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 500 }}>No hay etiquetas</p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>Pulsa 'Anclar' para añadir una</p>
                </div>
              ) : (
                <>
                  {!selectedLabel ? (
                    <Section label="Gestionar Etiquetas">
                      <div className="labels-mobile-list">
                        {activeLabels.map(l => (
                          <div key={l.id} className="label-pill" onClick={() => updateState({ activeLabelId: l.id })}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>{l.text}</span>
                            <Trash2 size={14} style={{ color: 'rgba(255,255,255,0.2)' }} onClick={(e) => { e.stopPropagation(); removeText(l.id); }} />
                          </div>
                        ))}
                      </div>
                    </Section>
                  ) : (
                    <div style={{ paddingBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 4px' }}>
                        <button onClick={() => updateState({ activeLabelId: null })} style={{ padding: 4, background: 'none', border: 'none', color: '#fff' }}>
                           <MousePointer2 size={20} />
                        </button>
                        <input value={selectedLabel.text} onChange={(e) => updateText(selectedLabel.id, { text: e.target.value })}
                          style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, outline: 'none' }} />
                        <Trash2 size={18} style={{ color: 'rgba(255,255,255,0.3)' }} onClick={() => { removeText(selectedLabel.id); updateState({ activeLabelId: null }); }} />
                      </div>

                      <div className="segmented-control" style={{ display: 'flex', gap: 4, borderRadius: 12, padding: 3, marginBottom: 16 }}>
                        {TABS.map(t => (
                          <button key={t.id} onClick={() => setLTab(t.id)}
                            className={lTab === t.id ? 'active-pill' : ''}
                            style={{ 
                              flex: 1, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              background: 'transparent',
                              color: lTab === t.id ? '#fff' : 'rgba(255,255,255,0.35)',
                            }}>
                            <t.icon size={13} />
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {lTab === 'behavior' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 8 }}>Tipo de Rastreo</span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {LABEL_MODES.map(mode => (
                                <Chip key={mode.id} active={selectedLabel.labelMode === mode.id} onClick={() => handleUpdate({ labelMode: mode.id })}>{mode.label}</Chip>
                              ))}
                            </div>
                          </div>
                          <Slider label="Elevación (Z)" value={selectedLabel.levitation} min={0} max={60} onChange={v => handleUpdate({ levitation: v })} unit="px" />
                        </div>
                      )}

                      {lTab === 'style' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <Slider label="Tamaño Fuente" value={selectedLabel.fontSize} min={8} max={42} onChange={v => handleUpdate({ fontSize: v })} unit="pt" />
                            </div>
                            <div style={{ width: 50 }}>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 6 }}>Color</span>
                              <div style={{ position: 'relative', width: '100%', height: 34 }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: 8, background: selectedLabel.color, border: '2px solid rgba(255,255,255,0.2)' }} />
                                <input type="color" value={selectedLabel.color} onChange={e => handleUpdate({ color: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 8 }}>Tipografía</span>
                            <div className="ps-responsive-list">
                              {FONTS.map(f => (
                                <Chip key={f} active={selectedLabel.fontFamily === f} onClick={() => handleUpdate({ fontFamily: f })} style={{ fontFamily: f }}>{f}</Chip>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {lTab === 'positions' && (
                        <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.5 }}>
                           <p style={{ fontSize: 12 }}>Use el modo 'Anclar' para cambiar la posición</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {state.labelsSubTab === 'subtract' && (
            <Section label="Limpiar Todo">
              <div style={{ padding: '20px 10px' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>¿Deseas eliminar todas las etiquetas del modelo?</p>
                <button onClick={() => { clearLabels(); updateState({ labelsSubTab: 'view' }); }}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 700, cursor: 'pointer' }}>
                  Eliminar todo
                </button>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── DESKTOP VIEW ────────────────────────────────────────────── */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sub-tabs premium */}
          <div className="segmented-control" style={{ display: 'flex', gap: 4, borderRadius: 12, padding: 3 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setLTab(t.id)}
                className={lTab === t.id ? 'active-pill' : ''}
                style={{ 
                  flex: 1, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'transparent',
                  color: lTab === t.id ? '#fff' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  textShadow: lTab === t.id ? '0 0 12px rgba(255,255,255,0.3)' : 'none'
                }}>
                <t.icon size={13} strokeWidth={lTab === t.id ? 2.5 : 2} />
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ minHeight: 180 }}>
            {lTab === 'positions' && (
              <Section label="Ubicación y Gestión">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 140px' }}>
                    <DeviceSilhouette>
                      {LABEL_POSITIONS.map(pos => (
                        <button key={pos.id} onClick={() => addLabel(pos.id)} 
                          style={{ 
                            position: 'absolute', left: pos.left, top: pos.top, 
                            transform: 'translate(-50%,-50%)', width: 20, height: 20, 
                            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', 
                            background: 'rgba(255,255,255,0.1)', color: '#fff', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      ))}
                    </DeviceSilhouette>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Etiquetas ({activeLabels.length})</span>
                      {activeLabels.length > 0 && (
                        <button onClick={clearLabels} style={{ fontSize: 8, background: 'transparent', border: 'none', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>Recetear</button>
                      )}
                    </div>
                    <div className="styled-scroll" style={{ height: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {activeLabels.map(l => (
                        <div key={l.id} onClick={() => updateState({ activeLabelId: l.id })}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 10, cursor: 'pointer',
                            background: state.activeLabelId === l.id ? 'rgba(139,92,246,0.24)' : 'rgba(0,0,0,0.4)',
                            border: `1px solid ${state.activeLabelId === l.id ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`
                          }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                          <input value={l.text} onChange={(e) => updateText(l.id, { text: e.target.value })} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, outline: 'none' }} />
                          <Trash2 size={12} style={{ color: 'rgba(255,255,255,0.2)' }} onClick={(e) => { e.stopPropagation(); removeText(l.id); }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {lTab === 'behavior' && (
              <Section label="Conducta">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 8 }}>Tipo de Rastreo</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {LABEL_MODES.map(mode => (
                        <Chip key={mode.id} active={getCurrentValue('labelMode', 'labelDraftMode') === mode.id} onClick={() => handleUpdate({ [selectedLabel ? 'labelMode' : 'labelDraftMode']: mode.id })}>{mode.label}</Chip>
                      ))}
                    </div>
                  </div>
                  <Slider label="Elevación (Z)" value={getCurrentValue('levitation', 'labelDraftLevitation')} min={0} max={60} onChange={v => handleUpdate({ [selectedLabel ? 'levitation' : 'labelDraftLevitation']: v })} unit="px" />
                </div>
              </Section>
            )}

            {lTab === 'style' && (
              <Section label="Estilo">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Slider label="Tamaño Fuente" value={getCurrentValue('fontSize', 'labelDraftSize')} min={8} max={42} onChange={v => handleUpdate({ [selectedLabel ? 'fontSize' : 'labelDraftSize']: v })} unit="pt" />
                    </div>
                    <div style={{ width: 50 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 6 }}>Color</span>
                      <div style={{ position: 'relative', width: '100%', height: 34 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: 8, background: getCurrentValue('color', 'labelDraftColor'), border: '2px solid rgba(255,255,255,0.2)' }} />
                        <input type="color" value={getCurrentValue('color', 'labelDraftColor')} onChange={e => handleUpdate({ [selectedLabel ? 'color' : 'labelDraftColor']: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 8 }}>Tipografía</span>
                    <div className="ps-responsive-list">
                      {FONTS.map(f => (
                        <Chip key={f} active={getCurrentValue('fontFamily', 'labelDraftFont') === f} onClick={() => handleUpdate({ [selectedLabel ? 'fontFamily' : 'labelDraftFont']: f })} style={{ fontFamily: f }}>{f}</Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
