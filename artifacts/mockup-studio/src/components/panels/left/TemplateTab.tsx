import * as React from 'react';
import { useApp } from '../../../store';
import type { CanvasRatio } from '../../../store';

type Fmt = { id: CanvasRatio; label: string; name: string; platforms: string; value: number; accent: string };

const SOCIAL: Fmt[] = [
  { id: '1:1',  label: '1:1',  name: 'Square',   platforms: 'Instagram · Facebook', value: 1,      accent: '#E1306C' },
  { id: '4:5',  label: '4:5',  name: 'Portrait', platforms: 'Instagram Post',        value: 4/5,    accent: '#C13584' },
  { id: '9:16', label: '9:16', name: 'Story',    platforms: 'Instagram · TikTok',   value: 9/16,   accent: '#FF0050' },
  { id: '16:9', label: '16:9', name: 'Video',    platforms: 'YouTube · Twitter',    value: 16/9,   accent: '#FF0000' },
  { id: '2:3',  label: '2:3',  name: 'Pin',      platforms: 'Pinterest',             value: 2/3,    accent: '#E60023' },
  { id: '3:1',  label: '3:1',  name: 'Banner',   platforms: 'Twitter · LinkedIn',   value: 3,      accent: '#0A66C2' },
];

const SLIDES: Fmt[] = [
  { id: '16:9', label: '16:9', name: 'Widescreen', platforms: 'Google Slides · PowerPoint', value: 16/9, accent: '#4285F4' },
  { id: '4:3',  label: '4:3',  name: 'Standard',   platforms: 'PowerPoint · Keynote',       value: 4/3,  accent: '#D24726' },
  { id: '3:2',  label: '3:2',  name: 'Classic',    platforms: 'Keynote · Photography',      value: 3/2,  accent: '#9B9B9B' },
  { id: '5:4',  label: '5:4',  name: 'Photo',      platforms: 'Print · Presentation',       value: 5/4,  accent: '#FBBC05' },
];

const MAX_W = 40, MAX_H = 30;

const RatioTile = ({ fmt, state, updateState }: { fmt: Fmt; state: any; updateState: any }) => {
  const isActive = state.canvasRatio === fmt.id;
  const rw = Math.min(MAX_W, MAX_H * fmt.value);
  const rh = Math.min(MAX_H, MAX_W / fmt.value);
  return (
    <button
      onClick={() => updateState({ canvasRatio: fmt.id })}
      style={{
        flexShrink: 0, width: 72, height: 86, borderRadius: 11,
        background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
        border: 'none', cursor: 'pointer', padding: 0,
        outline: isActive ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.13)',
        transition: 'all 0.12s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
      <div style={{
        width: rw, height: rh, flexShrink: 0, marginBottom: 8,
        border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)'}`,
        borderRadius: 2,
        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        transition: 'all 0.12s',
      }} />
      <span style={{
        fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
        color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
      }}>
        {fmt.label}
      </span>
      <span style={{
        fontSize: 7.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
        color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
        marginTop: 3, lineHeight: 1,
      }}>
        {fmt.name}
      </span>
    </button>
  );
};

const Divider = () => (
  <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)', flexShrink: 0, alignSelf: 'center' }} />
);

export const TemplateTab = () => {
  const { state, updateState } = useApp();

  return (
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' } as React.CSSProperties}>
      {SOCIAL.map(fmt => <RatioTile key={fmt.id + fmt.name} fmt={fmt} state={state} updateState={updateState} />)}
      <Divider />
      {SLIDES.map(fmt => <RatioTile key={fmt.id + fmt.name} fmt={fmt} state={state} updateState={updateState} />)}
    </div>
  );
};
