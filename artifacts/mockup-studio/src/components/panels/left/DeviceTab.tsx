import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../store';
import { Section, Chip } from '../../ui/PanelUI';
import { DeviceThumbnail } from '../../ui/DeviceThumbnails';
import { DEVICE_MODELS, DEVICE_GROUPS, getModelById } from '../../../data/devices';
import { IPHONE_COLORS } from '../../../data/panelConstants';
import { clampL, safeW } from '../../../utils/panelUtils';
import type { DeviceColor } from '../../../store';
import type { DeviceGroup } from '../../../data/devices';

export const DeviceTab = () => {
  const { state, updateState } = useApp();
  
  const [deviceGroupPopup, setDeviceGroupPopup] = useState<DeviceGroup | null>(null);
  const [deviceGroupAnchor, setDeviceGroupAnchor] = useState<{ x: number; y: number } | null>(null);
  const deviceGroupPopupRef = useRef<HTMLDivElement>(null);

  const [deviceOptPopup, setDeviceOptPopup] = useState<null | 'color' | 'orient'>(null);
  const [deviceOptAnchor, setDeviceOptAnchor] = useState<{ x: number; y: number } | null>(null);
  const deviceOptRef = useRef<HTMLDivElement>(null);
  const deviceColorBtnRef = useRef<HTMLButtonElement>(null);
  const deviceOrientBtnRef = useRef<HTMLButtonElement>(null);

  const activeModel = getModelById(state.deviceModel);
  const activeGroup = activeModel?.group;
  const hasColors = !!activeModel?.hasColors;
  const hasOrientation = !!activeModel?.hasOrientation;
  const hasBrowserTheme = state.deviceType === 'browser';

  // Close popups on click outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (deviceGroupPopup && deviceGroupPopupRef.current && !deviceGroupPopupRef.current.contains(e.target as Node)) {
        setDeviceGroupPopup(null);
      }
      if (deviceOptPopup) {
        const insidePopup = deviceOptRef.current?.contains(e.target as Node);
        const insideColor = deviceColorBtnRef.current?.contains(e.target as Node);
        const insideOrient = deviceOrientBtnRef.current?.contains(e.target as Node);
        if (!insidePopup && !insideColor && !insideOrient) setDeviceOptPopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [deviceGroupPopup, deviceOptPopup]);

  return (
    <>
      {deviceGroupPopup && deviceGroupAnchor && (() => {
        const popupModels = DEVICE_MODELS.filter(m => m.group === deviceGroupPopup);
        return (
          <div ref={deviceGroupPopupRef} style={{
            position: 'fixed',
            left: clampL(deviceGroupAnchor.x, 280, -140),
            top: Math.min(deviceGroupAnchor.y + 52, window.innerHeight - 300),
            width: safeW(280),
            maxHeight: 'min(400px, calc(100vh - 80px))',
            overflowY: 'auto',
            background: 'rgba(18,20,26,0.98)',
            borderRadius: 18, padding: '12px 12px 10px', zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{deviceGroupPopup}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {popupModels.map(model => {
                const isSelected = state.deviceModel === model.id;
                return (
                  <button key={model.id}
                    onClick={() => {
                      updateState({
                        deviceModel: model.id,
                        deviceType: model.storeType,
                        deviceColor: model.useOriginalMaterials ? 'original' : 'titanium'
                      });
                      setDeviceGroupPopup(null);
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      width: 72, padding: '10px 4px 8px', borderRadius: 14, gap: 0,
                      background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                      border: isSelected ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    <div style={{ height: 52, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.25)', transformOrigin: 'center' }}>
                      <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                      marginTop: 6, color: isSelected ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.55)',
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{model.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {deviceOptPopup === 'color' && deviceOptAnchor && (
        <div ref={deviceOptRef} style={{
          position: 'fixed',
          left: clampL(deviceOptAnchor.x, 240, -120),
          bottom: Math.max(12, window.innerHeight - deviceOptAnchor.y + 8),
          width: safeW(240),
          background: 'rgba(18,20,26,0.98)',
          borderRadius: 18, padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(22px)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Color del Marco</div>

          {/* Original color toggle */}
          <button
            onClick={() => updateState({ deviceColor: 'original' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 10px', marginBottom: 10,
              background: state.deviceColor === 'original' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
              border: state.deviceColor === 'original' ? '1.5px solid rgba(255,255,255,0.25)' : '1.5px solid rgba(255,255,255,0.08)',
              borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: 'conic-gradient(from 0deg, #ff4d4d, #f9cb28, #7cfc00, #00ffff, #4d4dff, #ff00ff, #ff4d4d)',
              border: '2px solid rgba(255,255,255,0.3)',
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: state.deviceColor === 'original' ? '#fff' : 'rgba(255,255,255,0.6)' }}>
              Color Original del Modelo
            </span>
          </button>

          {/* Preset color swatches */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {IPHONE_COLORS.filter(c => c.id !== 'original').map(c => {
              const isActive = state.deviceColor === c.id;
              return (
                <button key={c.id} title={c.label} onClick={() => updateState({ deviceColor: c.id })}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c.bg,
                    border: isActive ? '2.5px solid rgba(255,255,255,0.80)' : `2px solid ${c.border}`,
                    boxShadow: isActive ? '0 0 0 2.5px rgba(255,255,255,0.13)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                  }} />
              );
            })}

            {/* Custom color picker */}
            <label title="Color Personalizado" style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              background: state.deviceColor.startsWith('#')
                ? state.deviceColor
                : 'linear-gradient(135deg, #444, #222)',
              border: state.deviceColor.startsWith('#')
                ? '2.5px solid rgba(255,255,255,0.80)'
                : '2px dashed rgba(255,255,255,0.3)',
              boxShadow: state.deviceColor.startsWith('#')
                ? '0 0 0 2.5px rgba(255,255,255,0.13)' : 'none',
              transition: 'all 0.15s',
            }}>
              <span style={{
                fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                lineHeight: 1,
                display: state.deviceColor.startsWith('#') ? 'none' : 'block',
              }}>+</span>
              <input
                type="color"
                value={state.deviceColor.startsWith('#') ? state.deviceColor : '#ff6b35'}
                onChange={(e) => updateState({ deviceColor: e.target.value as DeviceColor })}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  opacity: 0, cursor: 'pointer',
                  border: 'none', padding: 0,
                }}
              />
            </label>
          </div>

          {/* Show hex value when custom */}
          {state.deviceColor.startsWith('#') && (
            <div style={{
              marginTop: 8, fontSize: 10, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Personalizado: {state.deviceColor}
            </div>
          )}
        </div>
      )}

      {deviceOptPopup === 'orient' && deviceOptAnchor && (
        <div ref={deviceOptRef} style={{
          position: 'fixed',
          left: clampL(deviceOptAnchor.x, 200, -100),
          top: Math.min(deviceOptAnchor.y + 52, window.innerHeight - 160),
          width: safeW(200),
          background: 'rgba(18,20,26,0.98)',
          borderRadius: 18, padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(22px)',
        }}>
          {hasOrientation && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Orientación</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip active={!state.deviceLandscape} onClick={() => updateState({ deviceLandscape: false })}>Vertical</Chip>
                <Chip active={state.deviceLandscape} onClick={() => updateState({ deviceLandscape: true })}>Horizontal</Chip>
              </div>
            </>
          )}
          {hasBrowserTheme && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Tema del Navegador</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Chip active={state.browserMode === 'dark'} onClick={() => updateState({ browserMode: 'dark' })}>Oscuro</Chip>
                <Chip active={state.browserMode === 'light'} onClick={() => updateState({ browserMode: 'light' })}>Claro</Chip>
              </div>
            </>
          )}
        </div>
      )}

      <Section label="Dispositivo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            flex: 1, display: 'flex', gap: 5, overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {DEVICE_GROUPS.map(group => {
              const isOpen = deviceGroupPopup === group;
              const isActive = activeGroup === group;
              const repModel = DEVICE_MODELS.find(m => m.group === group);
              return (
                <button key={group}
                  onClick={e => {
                    if (isOpen) { setDeviceGroupPopup(null); return; }
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setDeviceGroupAnchor({ x: r.left + r.width / 2, y: r.top });
                    setDeviceGroupPopup(group);
                    setDeviceOptPopup(null);
                  }}
                  title={group}
                  style={{
                    flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive || isOpen ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: isOpen
                      ? '1.5px solid rgba(167,139,250,0.8)'
                      : isActive
                        ? '2px solid rgba(255,255,255,0.85)'
                        : '1px solid rgba(255,255,255,0.14)',
                    color: isActive || isOpen ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.12s',
                  }}>
                  {repModel && <DeviceThumbnail modelId={repModel.id} isSelected={isActive || isOpen} />}
                </button>
              );
            })}
          </div>

          {(hasColors || hasOrientation || hasBrowserTheme) && (
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
          )}

          {hasColors && (
            <button
              aria-label="Color del Dispositivo"
              ref={deviceColorBtnRef}
              onClick={() => {
                const next = deviceOptPopup === 'color' ? null : 'color';
                const r = deviceColorBtnRef.current?.getBoundingClientRect();
                if (r) setDeviceOptAnchor({ x: r.left + r.width / 2, y: r.top });
                setDeviceOptPopup(next);
                setDeviceGroupPopup(null);
              }}
              style={{
                flexShrink: 0, padding: '5px 9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                alignSelf: 'stretch', justifyContent: 'center',
                background: deviceOptPopup === 'color' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                outline: deviceOptPopup === 'color' ? '1.5px solid rgba(167,139,250,0.8)' : '1px solid rgba(255,255,255,0.12)',
                color: deviceOptPopup === 'color' ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.55)',
                fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: IPHONE_COLORS.find(c => c.id === state.deviceColor)?.bg ?? IPHONE_COLORS[0].bg,
                border: '1.5px solid rgba(255,255,255,0.3)',
              }} />
            </button>
          )}

          {(hasOrientation || hasBrowserTheme) && (
            <button
              aria-label={hasBrowserTheme ? 'Browser theme' : 'Device orientation'}
              ref={deviceOrientBtnRef}
              onClick={() => {
                const next = deviceOptPopup === 'orient' ? null : 'orient';
                const r = deviceOrientBtnRef.current?.getBoundingClientRect();
                if (r) setDeviceOptAnchor({ x: r.left + r.width / 2, y: r.top });
                setDeviceOptPopup(next);
                setDeviceGroupPopup(null);
              }}
              style={{
                flexShrink: 0, padding: '5px 9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                alignSelf: 'stretch', justifyContent: 'center',
                background: deviceOptPopup === 'orient' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                outline: deviceOptPopup === 'orient' ? '1.5px solid rgba(167,139,250,0.8)' : '1px solid rgba(255,255,255,0.12)',
                color: deviceOptPopup === 'orient' ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.55)',
                fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {hasBrowserTheme
                  ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                  : <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 014 0v2"/></>
                }
              </svg>
            </button>
          )}
        </div>
      </Section>
    </>
  );
};
