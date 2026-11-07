import * as React from 'react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';
import { PATTERNS } from '../../../data/backgrounds';

export const PatternsTab = () => {
  const { state, updateState } = useApp();

  const THUMB: React.CSSProperties = {
    width: '100%', height: 60, borderRadius: 10, marginBottom: 5,
    border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  const SWATCH_BTN = (active: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px', borderRadius: 14, border: 'none', cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
    outline: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.10)',
    transition: 'all 0.12s', flexShrink: 0,
  });

  const SWATCH_LABEL = (active: boolean): React.CSSProperties => ({
    fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
    color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
    marginTop: 4,
  });

  const selectPattern = (patternId: string) => {
    updateState({ 
      bgPatternEnabled: true,
      bgPattern: patternId
    });
  };

  return (
    <div className="panel-text-contrast">
      <Section label="Seleccionar Patrón">
        <div className="ps-responsive-list" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <button 
            onClick={() => updateState({ bgPatternEnabled: false })} 
            style={SWATCH_BTN(!state.bgPatternEnabled)}
          >
            <div style={{ 
              ...THUMB, 
              background: '#111113',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <span style={SWATCH_LABEL(!state.bgPatternEnabled)}>Ninguno</span>
          </button>

          {PATTERNS.map(p => {
            const active = state.bgPatternEnabled && state.bgPattern === p.id;
            return (
              <button key={p.id} onClick={() => selectPattern(p.id)} style={SWATCH_BTN(active)}>
                <div style={{ ...THUMB, ...p.bgStyle('#1a1c2e', '#ffffff') }} />
                <span style={SWATCH_LABEL(active)}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

export default PatternsTab;
