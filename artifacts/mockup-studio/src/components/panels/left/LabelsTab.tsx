import * as React from 'react';
import { useApp } from '../../../store';
import { Chip, Slider } from '../../ui/PanelUI';
import type { LabelAnchorPosition } from '../../../store';

const LABEL_MODES = [
  { id: 'follow', label: 'Seguir Cámara' },
  { id: 'billboard', label: 'Efecto Cartelera' },
  { id: 'fixed', label: 'Fijo al Modelo' },
] as const;

const LABEL_POSITIONS: { id: LabelAnchorPosition; left: string; top: string }[] = [
  { id: 'top', left: '50%', top: '8%' },
  { id: 'top-right', left: '60%', top: '20%' },
  { id: 'right', left: '64%', top: '50%' },
  { id: 'bottom-right', left: '60%', top: '80%' },
  { id: 'bottom', left: '50%', top: '92%' },
  { id: 'bottom-left', left: '40%', top: '80%' },
  { id: 'left', left: '36%', top: '50%' },
  { id: 'top-left', left: '40%', top: '20%' },
];

export const LabelsTab = () => {
  const { state, updateState, addLabel, clearLabels } = useApp();
  const labelCount = state.texts.filter(text => text.kind === 'label').length;
  
  const lTab = state.labelTabActive;
  const setLTab = (tab: 'positions' | 'behavior' | 'style') => updateState({ labelTabActive: tab });
  
  const TABS = [
    { id: 'positions' as const, label: 'Posiciones' },
    { id: 'behavior'  as const, label: 'Comportamiento'  },
    { id: 'style'     as const, label: 'Estilo'     },
  ];

  const ensureStyleTab = () => { if (lTab !== 'style') setLTab('style'); };

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '10px 10px' }}>
      {/* Pill tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 3 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setLTab(t.id)}
            style={{ flex: 1, height: 26, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
              background: lTab === t.id ? 'rgba(255,255,255,0.13)' : 'transparent',
              color: lTab === t.id ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)',
              transition: 'all 0.13s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Positions */}
      {lTab === 'positions' && (
        <>
          <div style={{ position: 'relative', height: 110, borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', width: 44, height: 72, transform: 'translate(-50%,-50%)', borderRadius: 8, border: '2px solid rgba(255,255,255,0.38)' }} />
            {LABEL_POSITIONS.map(pos => (
              <button key={pos.id} onClick={() => addLabel(pos.id)} title={`Añadir etiqueta de tipo ${pos.id}`}
                style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              </button>
            ))}
          </div>
          <button onClick={clearLabels} disabled={labelCount === 0}
            style={{ width: '100%', height: 30, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: labelCount === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.52)', fontSize: 11, fontWeight: 700, cursor: labelCount === 0 ? 'not-allowed' : 'pointer' }}>
            Borrar todas ({labelCount})
          </button>
        </>
      )}

      {/* Behavior */}
      {lTab === 'behavior' && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {LABEL_MODES.map(mode => (
              <Chip key={mode.id} active={state.labelDraftMode === mode.id} onClick={() => updateState({ labelDraftMode: mode.id })}>{mode.label}</Chip>
            ))}
          </div>
          <Slider label="Elevación" value={state.labelDraftLevitation} min={0} max={42} step={1} onChange={v => updateState({ labelDraftLevitation: v })} unit="px" />
        </>
      )}

      {/* Style */}
      {lTab === 'style' && (
        <>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Tamaño</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <input type="number" min={8} max={48} value={state.labelDraftSize} onChange={e => { ensureStyleTab(); updateState({ labelDraftSize: Number(e.target.value) || 13 }); }} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 700 }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>pt</span>
                </div>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Color</span>
                <div style={{ position: 'relative', width: 44 }}>
                  <div style={{ width: 44, height: 36, borderRadius: 9, background: state.labelDraftColor, border: '1px solid rgba(255,255,255,0.18)' }} />
                  <input type="color" value={state.labelDraftColor} onChange={e => { ensureStyleTab(); updateState({ labelDraftColor: e.target.value }); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </label>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Fuente</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <select value={state.labelDraftFont} onChange={e => { ensureStyleTab(); updateState({ labelDraftFont: e.target.value }); }}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, fontFamily: state.labelDraftFont }}>
                <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
                <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                <option value="Comic Sans MS" style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans MS</option>
                <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
                <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <button onClick={() => { ensureStyleTab(); updateState({ labelDraftMode: 'follow', labelDraftSize: 13, labelDraftLevitation: 16, labelDraftColor: '#ffffff' }); }}
              style={{ height: 36, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.52)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Restablecer
            </button>
          </div>
        </>
      )}
    </div>
  );
};
