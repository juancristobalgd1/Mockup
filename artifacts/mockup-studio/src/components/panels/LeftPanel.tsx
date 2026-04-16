import * as React from 'react';
import { Layout, Palette, Image as ImageIcon, Sparkles, Pencil, MousePointer2, Settings2, Box, Layers, Grid3X3 } from 'lucide-react';

// Modular Components
import { DeviceTab } from './left/DeviceTab.fixed';
import { BackgroundTab } from './left/BackgroundTab';
import { OverlayTab } from './left/OverlayTab';
import { AnnotateTab } from './left/AnnotateTab.fixed';
import { LabelsTab } from './left/LabelsTab';
import { SceneTab } from './left/SceneTab';
import { PresetsTab } from './left/PresetsTab.fixed';
import { TemplateTab } from './left/TemplateTab';
import PatternsTab from './left/PatternsTab.fixed';

import '../../index.css';

const TAB_ICONS = [
  { id: 'presets'    as const, icon: Sparkles,     label: 'Preajustes' },
  { id: 'template'   as const, icon: Layout,       label: 'Plantillas' },
  { id: 'device'     as const, icon: Box,          label: 'Dispositivo' },
  { id: 'background' as const, icon: ImageIcon,    label: 'Fondo'       },
  { id: 'overlay'    as const, icon: Layers,       label: 'Overlay'     },
  { id: 'patterns'   as const, icon: Grid3X3,      label: 'Patrones'    },
  { id: 'annotate'   as const, icon: Pencil,       label: 'Annotate'      },
  { id: 'canvas'     as const, icon: Settings2,    label: 'Escena'      },
  { id: 'labels'     as const, icon: MousePointer2, label: 'Etiquetas'   },
] as const;

export interface LeftPanelProps {
  mobile?: boolean;
  mobileContentOnly?: 'presets' | 'template' | 'device' | 'background' | 'overlay' | 'patterns' | 'annotate' | 'canvas' | 'labels';
  activeTab: string;
  setActiveTab: (tab: any) => void;
  backgroundPanelView?: 'hub' | 'content';
  setBackgroundPanelView?: (view: 'hub' | 'content') => void;
}

export function LeftPanel({
  mobile,
  mobileContentOnly,
  activeTab,
  setActiveTab,
  backgroundPanelView,
  setBackgroundPanelView,
}: LeftPanelProps) {
  // ── Mobile content-only mode (rendered inside a floating sheet) ──
  if (mobile && mobileContentOnly !== undefined) {
    return (
      <div className="panel-text-contrast" style={{ padding: '12px 0 16px' }}>
        {mobileContentOnly === 'presets'    && <PresetsTab />}
        {mobileContentOnly === 'template'   && <TemplateTab />}
        {mobileContentOnly === 'device'     && <DeviceTab />}
        {mobileContentOnly === 'background' && <BackgroundTab mobileView={backgroundPanelView} setMobileView={setBackgroundPanelView} />}
        {mobileContentOnly === 'overlay'    && <OverlayTab />}
        {mobileContentOnly === 'patterns'   && <PatternsTab />}
        {mobileContentOnly === 'annotate'   && <AnnotateTab />}
        {mobileContentOnly === 'canvas'     && <SceneTab />}
        {mobileContentOnly === 'labels'     && <LabelsTab />}
      </div>
    );
  }

  // ── Mobile shell — content top, pill nav bottom ──
  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="styled-scroll panel-text-contrast" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 14px 8px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'template'   && <TemplateTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'overlay'    && <OverlayTab />}
          {activeTab === 'patterns'   && <PatternsTab />}
          {activeTab === 'annotate'   && <AnnotateTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'labels'     && <LabelsTab />}
        </div>

        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          padding: '8px 14px 12px', flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}>
          {TAB_ICONS.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 22, fontSize: 12, fontWeight: 600,
                  background: active ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
                  border: '1px solid transparent',
                  color: active ? '#0d0e0f' : 'rgba(255,255,255,0.48)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}>
                <Icon size={13} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Desktop shell (icon rail + content panel) ─────────────────
  return (
    <div style={{ display: 'flex', height: '100%', flexShrink: 0, overflow: 'hidden' }}>
      {/* Icon rail */}
      <div className="glass-panel" style={{
        width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 4px', gap: 4, flexShrink: 0,
        background: 'rgba(22, 24, 25, 0.4)',
        borderRight: '1px solid var(--rt-border)',
      }}>
        {/* Brand logo */}
        <div style={{
          width: 32, height: 32, borderRadius: 10, marginBottom: 12,
          background: 'rgba(255,255,255,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0d0e0f', fontWeight: 900, fontSize: 14, flexShrink: 0,
          fontStyle: 'italic', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>M</div>

        {TAB_ICONS.map(({ id, icon: Icon, label }) => (
          <button key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            aria-label={label}
            className="btn-press"
            style={{
              width: 50, height: 52, borderRadius: 10, border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: activeTab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
              outline: 'none',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <Icon size={18} strokeWidth={activeTab === id ? 2.2 : 1.5}
              style={{ color: activeTab === id ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.35)' }} />
            <span style={{ 
              fontSize: 10, fontWeight: 700, 
              color: activeTab === id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', 
              letterSpacing: '0.01em',
              textTransform: 'uppercase'
            }}>
              {label.slice(0, 5)}
            </span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="glass-panel" style={{
        width: 250, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
        background: 'rgba(30, 32, 34, 0.3)',
        borderRight: '1px solid var(--rt-border)',
      }}>
        {/* Tab header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--rt-border)', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
            {TAB_ICONS.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="styled-scroll panel-text-contrast" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'template'   && <TemplateTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'overlay'    && <OverlayTab />}
          {activeTab === 'patterns'   && <PatternsTab />}
          {activeTab === 'annotate'   && <AnnotateTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'labels'     && <LabelsTab />}
        </div>
      </div>
    </div>
  );
}
