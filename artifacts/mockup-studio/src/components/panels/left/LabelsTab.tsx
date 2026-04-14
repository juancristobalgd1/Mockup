import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, MapPin, Settings2, Palette, 
  Type, ChevronDown, ChevronUp, MousePointer2 
} from 'lucide-react';
import { useApp } from '../../../store';
import { Section, Chip, Slider, Toggle } from '../../ui/PanelUI';
import type { LabelAnchorPosition, TextOverlay, LabelTrackingMode, AppState } from '../../../store';

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
    position: 'relative', height: 160, borderRadius: 20, 
    background: '#09090b', 
    border: '1px solid rgba(255,255,255,0.12)', 
    marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.4)'
  }}>
    <div style={{ 
      position: 'absolute', inset: 0, opacity: 0.12, 
      backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)', 
      backgroundSize: '20px 20px' 
    }} />
    <div style={{ 
      width: 48, height: 96, borderRadius: 12, 
      border: '2.5px solid rgba(255,255,255,0.2)', 
      background: 'rgba(255,255,255,0.04)',
      boxShadow: '0 0 40px rgba(0,0,0,0.6)',
      position: 'relative', zIndex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '85%', height: '90%', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
    </div>
    {children}
  </div>
);


export const LabelsTab = () => {
  const { state, updateState, addLabel, clearLabels, updateText, removeText } = useApp();
  const [lTab, setLTab] = useState<'positions' | 'behavior' | 'style'>(state.labelTabActive ?? 'positions');
  
  const activeLabels = state.texts.filter(text => text.kind === 'label');
  const selectedLabel = activeLabels.find(l => l.id === state.activeLabelId);

  const TABS = [
    { id: 'positions' as const, label: 'Posición', icon: MapPin },
    { id: 'behavior'  as const, label: 'Conducta', icon: Settings2 },
    { id: 'style'     as const, label: 'Estilo', icon: Palette },
  ];

  const handleSetTab = (tab: typeof lTab) => {
    setLTab(tab);
    updateState({ labelTabActive: tab });
  };

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
      // If switching to 'fixed' mode, initialize coordinates from anchor to avoid jump
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Sub-tabs premium */}
      <div className="segmented-control" style={{ display: 'flex', gap: 4, borderRadius: 12, padding: 3 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleSetTab(t.id)}
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
        {/* Pestaña: POSICIÓN */}
        {lTab === 'positions' && (
          <Section label="Ubicación y Gestión">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 140px' }}>
                <DeviceSilhouette>
                  {LABEL_POSITIONS.map(pos => (
                    <button key={pos.id} 
                      onClick={() => addLabel(pos.id)} 
                      title={`Añadir etiqueta en: ${pos.id}`}
                      style={{ 
                        position: 'absolute', left: pos.left, top: pos.top, 
                        transform: 'translate(-50%,-50%)', width: 20, height: 20, 
                        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', 
                        background: 'rgba(255,255,255,0.1)', color: '#fff', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)'
                      }}
                      onMouseEnter={e => { 
                        (e.currentTarget as any).style.background = 'rgba(255,255,255,0.25)'; 
                        (e.currentTarget as any).style.borderColor = 'rgba(255,255,255,0.6)';
                        (e.currentTarget as any).style.transform = 'translate(-50%,-50%) scale(1.15)'; 
                      }}
                      onMouseLeave={e => { 
                        (e.currentTarget as any).style.background = 'rgba(255,255,255,0.1)'; 
                        (e.currentTarget as any).style.borderColor = 'rgba(255,255,255,0.3)';
                        (e.currentTarget as any).style.transform = 'translate(-50%,-50%) scale(1)'; 
                      }}
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  ))}
                </DeviceSilhouette>
              </div>

              {/* Lista de etiquetas activas */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Etiquetas ({activeLabels.length})
                  </span>
                  {activeLabels.length > 0 && (
                    <button onClick={clearLabels} style={{ fontSize: 8, background: 'transparent', border: 'none', color: 'rgba(248,113,113,0.6)', cursor: 'pointer', fontWeight: 600 }}>
                      Recetear
                    </button>
                  )}
                </div>
                
                <div className="styled-scroll" style={{ height: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
                  {activeLabels.length === 0 ? (
                    <div style={{ 
                      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', textAlign: 'center', 
                      background: 'rgba(0,0,0,0.6)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.3)', fontSize: 10, fontStyle: 'italic',
                      lineHeight: 1.3
                    }}>
                      Grid para añadir
                    </div>
                  ) : (
                    activeLabels.map((l, i) => (
                      <div key={l.id} 
                        onClick={() => updateState({ activeLabelId: l.id })}
                        className="btn-press"
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', 
                          borderRadius: 10, cursor: 'pointer',
                          background: state.activeLabelId === l.id ? 'rgba(139,92,246,0.24)' : 'rgba(0,0,0,0.4)',
                          border: `1px solid ${state.activeLabelId === l.id ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          transition: 'all 0.15s',
                          animation: `panelFade 0.2s ease-out ${i * 0.03}s both`,
                        }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                        <input 
                          value={l.text} 
                          onChange={(e) => updateText(l.id, { text: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          style={{ 
                            flex: 1, background: 'transparent', border: 'none', color: state.activeLabelId === l.id ? '#fff' : 'rgba(255,255,255,0.6)',
                            fontSize: 11, fontWeight: 600, outline: 'none'
                          }} 
                        />
                        <button onClick={(e) => { e.stopPropagation(); removeText(l.id); }} 
                          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </Section>
        )}

        {/* Pestaña: CONDUCTA */}
        {lTab === 'behavior' && (
          <Section label={selectedLabel ? `Comportamiento: ${selectedLabel.text}` : "Ajustes de Comportamiento"}>
            {selectedLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editando etiqueta activa</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 8 }}>Tipo de Rastreo</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {LABEL_MODES.map(mode => (
                    <Chip 
                      key={mode.id} 
                      active={getCurrentValue('labelMode', 'labelDraftMode') === mode.id} 
                      onClick={() => handleUpdate({ [selectedLabel ? 'labelMode' : 'labelDraftMode']: mode.id })}
                    >
                      {mode.label}
                    </Chip>
                  ))}
                </div>
              </div>
              
              <Slider 
                label="Elevación (Z)" 
                value={getCurrentValue('levitation', 'labelDraftLevitation')} 
                min={0} max={60} 
                onChange={v => handleUpdate({ [selectedLabel ? 'levitation' : 'labelDraftLevitation']: v })} 
                unit="px" 
              />
              
              <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: 0 }}>
                  <strong style={{ color: 'rgba(167,139,250,0.9)' }}>Tip:</strong> {
                    getCurrentValue('labelMode', 'labelDraftMode') === 'follow' 
                    ? "La etiqueta intentará mantenerse legible rotando hacia la cámara."
                    : getCurrentValue('labelMode', 'labelDraftMode') === 'billboard'
                    ? "Efecto siempre plano hacia el espectador, ideal para títulos."
                    : "Anclaje rígido a la superficie del modelo 3D."
                  }
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* Pestaña: ESTILO */}
        {lTab === 'style' && (
          <Section label={selectedLabel ? `Apariencia: ${selectedLabel.text}` : "Estilo Predefinido"}>
            {selectedLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 8px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editando etiqueta activa</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Slider 
                    label="Tamaño Fuente" 
                    value={getCurrentValue('fontSize', 'labelDraftSize')} 
                    min={8} max={42} 
                    onChange={v => handleUpdate({ [selectedLabel ? 'fontSize' : 'labelDraftSize']: v })} 
                    unit="pt" 
                  />
                </div>
                <div style={{ width: 50 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 6 }}>Color</span>
                  <div style={{ position: 'relative', width: '100%', height: 34 }}>
                    <div style={{ 
                      width: '100%', height: '100%', borderRadius: 8, 
                      background: getCurrentValue('color', 'labelDraftColor'), 
                      border: '2px solid rgba(255,255,255,0.2)' 
                    }} />
                    <input type="color" 
                      value={getCurrentValue('color', 'labelDraftColor')} 
                      onChange={e => handleUpdate({ [selectedLabel ? 'color' : 'labelDraftColor']: e.target.value })} 
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                    />
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 8 }}>Tipografía</span>
                <div className="styled-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {FONTS.map(f => (
                    <Chip 
                      key={f} 
                      active={getCurrentValue('fontFamily', 'labelDraftFont') === f} 
                      onClick={() => handleUpdate({ [selectedLabel ? 'fontFamily' : 'labelDraftFont']: f })}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </Chip>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 10 }}>Presets de Estilo</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  <button 
                    onClick={() => handleUpdate({ fontSize: 24, color: '#ffffff', labelMode: 'billboard' })}
                    style={{ padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Título Grande
                  </button>
                  <button 
                    onClick={() => handleUpdate({ fontSize: 12, color: '#888888', labelMode: 'follow' })}
                    style={{ padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Detalle Técnico
                  </button>
                </div>
              </div>

              {!selectedLabel && (
                <div style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Selecciona una etiqueta para editarla</span>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

    </div>
  );
};
