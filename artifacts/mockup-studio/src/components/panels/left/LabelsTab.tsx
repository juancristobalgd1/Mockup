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
    position: 'relative', height: 130, borderRadius: 16, 
    background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)', 
    border: '1px solid rgba(255,255,255,0.06)', 
    marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)'
  }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
    <div style={{ 
      width: 42, height: 80, borderRadius: 10, 
      border: '2px solid rgba(255,255,255,0.15)', 
      background: 'rgba(255,255,255,0.03)',
      boxShadow: '0 0 25px rgba(0,0,0,0.5)',
      position: 'relative', zIndex: 1
    }}>
      <div style={{ margin: 2, height: 'calc(100% - 4px)', borderRadius: 7, background: 'rgba(255,255,255,0.01)' }} />
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
      <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleSetTab(t.id)}
            style={{ 
              flex: 1, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: lTab === t.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: lTab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
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
            <DeviceSilhouette>
              {LABEL_POSITIONS.map(pos => (
                <button key={pos.id} 
                  onClick={() => {
                    addLabel(pos.id);
                    // Select most recently added label - slightly tricky as state update is async
                    // We'll let the next render handle selection if we put it in store
                  }} 
                  title={`Añadir etiqueta en: ${pos.id}`}
                  style={{ 
                    position: 'absolute', left: pos.left, top: pos.top, 
                    transform: 'translate(-50%,-50%)', width: 24, height: 24, 
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', 
                    background: 'rgba(255,255,255,0.08)', color: '#fff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', transition: 'all 0.15s',
                    zIndex: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.2)'; (e.currentTarget as any).style.scale = '1.1'; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as any).style.scale = '1'; }}
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              ))}
            </DeviceSilhouette>

            {/* Lista de etiquetas activas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Añadidas ({activeLabels.length})
                </span>
                {activeLabels.length > 0 && (
                  <button onClick={clearLabels} style={{ fontSize: 9, background: 'transparent', border: 'none', color: 'rgba(248,113,113,0.7)', cursor: 'pointer', fontWeight: 600 }}>
                    Borrar todas
                  </button>
                )}
              </div>
              
              <div className="styled-scroll" style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {activeLabels.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, fontStyle: 'italic' }}>
                    No hay etiquetas aún.<br/>Usa el grid de arriba para añadir.
                  </div>
                ) : (
                  activeLabels.map(l => (
                    <div key={l.id} 
                      onClick={() => updateState({ activeLabelId: l.id })}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px', 
                        borderRadius: 10, cursor: 'pointer',
                        background: state.activeLabelId === l.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${state.activeLabelId === l.id ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.15s'
                      }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, boxShadow: `0 0 8px ${l.color}80` }} />
                      <input 
                        value={l.text} 
                        onChange={(e) => updateText(l.id, { text: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          flex: 1, background: 'transparent', border: 'none', color: state.activeLabelId === l.id ? '#fff' : 'rgba(255,255,255,0.8)',
                          fontSize: 12, fontWeight: 600, outline: 'none'
                        }} 
                      />
                      <button onClick={(e) => { e.stopPropagation(); removeText(l.id); }} 
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
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
