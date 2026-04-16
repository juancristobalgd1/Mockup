import * as React from 'react';
import { useState } from 'react';
import { 
  Plus, Trash2, MapPin, Settings2, Palette, 
  MousePointer2, ArrowLeft, CaseSensitive 
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

const ANCHOR_NAMES: Record<string, string> = {
  top: 'Arriba',
  'top-right': 'Arriba Der.',
  right: 'Derecha',
  'bottom-right': 'Abajo Der.',
  bottom: 'Abajo',
  'bottom-left': 'Abajo Izq.',
  left: 'Izquierda',
  'top-left': 'Arriba Izq.',
};

const DeviceSilhouette = ({ children, height = 260 }: { children: React.ReactNode, height?: number }) => (
  <div style={{ 
    position: 'relative', height, borderRadius: 24, 
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
      width: height * 0.27, height: height * 0.54, borderRadius: 16, 
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
  const [lTab, setLTab] = useState<'style' | 'behavior' | 'font'>('style');
  const isMobile = window.innerWidth <= 768;
  
  const activeLabels = state.texts.filter(text => text.kind === 'label');
  const selectedLabel = activeLabels.find(l => l.id === state.activeLabelId);

  const MOBILE_TABS = [
    { id: 'style'    as const, label: 'Estilo',   icon: Palette },
    { id: 'behavior' as const, label: 'Ajustes', icon: Settings2 },
    { id: 'font'     as const, label: 'Fuente',   icon: CaseSensitive },
  ];

  const TABS = [
    { id: 'style'    as const, label: 'Estilo',   icon: Palette },
    { id: 'behavior' as const, label: 'Ajustes', icon: Settings2 },
    { id: 'positions' as const, label: 'Posición', icon: MapPin },
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
          margin-top: 4px;
        }
        .label-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .label-pill:active {
          transform: scale(0.98);
          background: rgba(255,255,255,0.08);
        }
        .label-pill.active {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.3);
        }
        .compact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
      `}</style>

      {/* ── MOBILE DRILL-DOWN VIEW ──────────────────────────────────── */}
      {isMobile && (
        <div className="hide-scrollbars" style={{ overflowY: 'auto' }}>
          {state.labelsSubTab === 'add' && (
            <div style={{ marginTop: 8 }}>
              <DeviceSilhouette height={180}>
                {LABEL_POSITIONS.map(pos => (
                  <button key={pos.id} 
                    onClick={() => { addLabel(pos.id); updateState({ labelsSubTab: 'view' }); }} 
                    style={{ 
                      position: 'absolute', left: pos.left, top: pos.top, 
                      transform: 'translate(-50%,-50%)', width: 24, height: 24, 
                      borderRadius: '50%', border: '2px solid #fff', 
                      background: 'rgba(59,130,246,1)', color: '#fff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', zIndex: 2,
                      boxShadow: '0 0 15px rgba(59,130,246,0.6)'
                    }}
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                ))}
              </DeviceSilhouette>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
                Toca un punto para añadir una etiqueta
              </p>
            </div>
          )}

          {state.labelsSubTab === 'view' && (
            <>
              {activeLabels.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ 
                    width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.03)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
                  }}>
                    <MousePointer2 size={32} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>No hay etiquetas</p>
                  <p style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>Ancla etiquetas al modelo para gestionarlas</p>
                </div>
              ) : (
                <>
                  {!selectedLabel ? (
                    <div className="labels-mobile-list">
                      {activeLabels.map(l => (
                        <div key={l.id} className="label-pill" onClick={() => updateState({ activeLabelId: l.id })}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, boxShadow: `0 0 10px ${l.color}44` }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{l.text}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{ANCHOR_NAMES[l.labelAnchor || 'right']}</div>
                          </div>
                          <Trash2 size={16} style={{ color: 'rgba(239,68,68,0.4)' }} onClick={(e) => { e.stopPropagation(); removeText(l.id); }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '0 4px 20px' }}>
                      {/* Tab Navigation */}
                      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, marginBottom: 16 }}>
                        {MOBILE_TABS.map(t => (
                          <button 
                            key={t.id} 
                            onClick={() => setLTab(t.id)}
                            style={{ 
                              flex: 1, height: 32, border: 'none', borderRadius: 9, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              fontSize: 10, fontWeight: 750, color: lTab === t.id ? '#fff' : 'rgba(255,255,255,0.3)',
                              background: lTab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                              transition: 'all 0.2s'
                            }}
                          >
                            <t.icon size={13} />
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div style={{ minHeight: 120 }}>
                        {lTab === 'style' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tamaño Fuente</span>
                              <Slider value={selectedLabel.fontSize} min={8} max={42} onChange={v => handleUpdate({ fontSize: v })} unit="pt" />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Color</span>
                              <div style={{ position: 'relative', width: '100%', height: 30 }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: 10, background: selectedLabel.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                                <input type="color" value={selectedLabel.color} onChange={e => handleUpdate({ color: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {lTab === 'behavior' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Rastreo</span>
                              <div style={{ display: 'flex', gap: 5, overflowX: 'auto' }} className="hide-scrollbars">
                                {LABEL_MODES.map(mode => (
                                  <button 
                                    key={mode.id} 
                                    onClick={() => handleUpdate({ labelMode: mode.id })}
                                    style={{ 
                                      padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                                      background: selectedLabel.labelMode === mode.id ? '#fff' : 'rgba(255,255,255,0.04)',
                                      color: selectedLabel.labelMode === mode.id ? '#000' : 'rgba(255,255,255,0.4)',
                                      border: 'none'
                                    }}
                                  >
                                    {mode.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Elevación (Z)</span>
                              <Slider value={selectedLabel.levitation} min={0} max={60} onChange={v => handleUpdate({ levitation: v })} unit="px" />
                            </div>
                          </div>
                        )}

                        {lTab === 'font' && (
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Tipografía</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {FONTS.map(f => (
                                <button 
                                  key={f} 
                                  onClick={() => handleUpdate({ fontFamily: f })}
                                  style={{ 
                                    padding: '8px 10px', borderRadius: 8, fontSize: 11, border: 'none', textAlign: 'left',
                                    fontFamily: f,
                                    background: selectedLabel.fontFamily === f ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                                    color: selectedLabel.fontFamily === f ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                                    outline: selectedLabel.fontFamily === f ? '1px solid rgba(139, 92, 246, 0.3)' : 'none'
                                  }}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {state.labelsSubTab === 'subtract' && (
            <div style={{ padding: '8px 4px' }}>
              <div style={{ 
                background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', 
                borderRadius: 20, padding: '24px 20px', textAlign: 'center' 
              }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
                }}>
                  <Trash2 size={28} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>¿Limpiar todo?</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 24 }}>
                  Se eliminarán permanentemente todas las etiquetas actuales del modelo 3D.
                </p>
                <button onClick={() => { clearLabels(); updateState({ labelsSubTab: 'view' }); }}
                  style={{ 
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none', 
                    background: '#ef4444', color: '#fff', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(239,68,68,0.3)'
                  }}>
                  Confirmar eliminación
                </button>
              </div>
            </div>
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
