import * as React from 'react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';
import { PoseThumbnail } from '../../ui/DeviceThumbnails';
import { PRESENT_POSES } from '../../../data/panelConstants';

export const PresetsTab = () => {
  const { state, updateState } = useApp();

  const activePose = PRESENT_POSES.find(p => p.id === state.cameraAngle) ?? PRESENT_POSES[0];
  const scalePct   = state.deviceScale ?? 100;

  return (
    <div className="panel-text-contrast">
      <Section label="Escala del Dispositivo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
          <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 10 }}>
            <PoseThumbnail ry={activePose.ry} rx={activePose.rx} rz={activePose.rz} active={true} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Tamaño</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{scalePct}%</span>
            </div>
            <input type="range" min={40} max={160} step={1} value={scalePct}
              onChange={v => updateState({ deviceScale: Number(v.target.value) })}
              className="ms-range" />
          </div>
        </div>
      </Section>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 20, paddingTop: 20 }}>
        <Section label="Info del Ángulo">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Rotación Y</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{activePose.ry}°</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Marcador</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{activePose.label}</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};
