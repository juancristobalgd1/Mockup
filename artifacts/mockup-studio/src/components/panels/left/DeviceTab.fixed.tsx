import * as React from 'react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';
import { DeviceThumbnail } from '../../ui/DeviceThumbnails';
import { DEVICE_MODELS, getModelById } from '../../../data/devices';
import { IPHONE_COLORS } from '../../../data/panelConstants';
import { Smartphone, Plus } from 'lucide-react';

export const DeviceTab = () => {
  const { state, updateState } = useApp();
  
  const activeModel = getModelById(state.deviceModel);
  const activeGroup = activeModel?.group;
  const hasColors = !!activeModel?.hasColors;
  const hasOrientation = !!activeModel?.hasOrientation;
  const hasBrowserTheme = state.deviceType === 'browser';

  const activeGroupModels = DEVICE_MODELS.filter(m => m.group === activeGroup);

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="panel-text-contrast">
      {(!isMobile || state.deviceSubTab === 'models') && (
        <Section label={`Modelos: ${activeGroup || ''}`}>
        <div className="ps-responsive-list" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {activeGroupModels.map(model => {
            const isSelected = state.deviceModel === model.id;
            return (
              <button key={model.id}
                onClick={() => {
                  updateState({
                    deviceModel: model.id,
                    deviceType: model.storeType,
                    deviceColor: model.useOriginalMaterials ? 'original' : 'titanium'
                  });
                }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 6px', borderRadius: 14,
                  background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                  border: isSelected ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.14)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>
                <div style={{ height: 60, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.4)' }}>
                  <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                  marginTop: 10, color: isSelected ? '#fff' : 'rgba(255,255,255,0.45)',
                  maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{model.label}</span>
              </button>
            );
          })}
        </div>
        </Section>
      )}

      {(!isMobile || state.deviceSubTab === 'colors') && hasColors && (
        <div style={{ borderTop: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)', marginTop: isMobile ? 0 : 24, paddingTop: isMobile ? 0 : 20 }}>
          <Section label="Color del Marco">
              <div className="hide-scrollbars" style={{ display: 'flex', gap: 10, overflowX: 'auto', flexWrap: 'nowrap', alignItems: 'center', minWidth: 0, paddingBottom: 4 }}>
                {/* 1. Original Materials */}
                <button
                  onClick={() => updateState({ deviceColor: 'original', clayMode: false })}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'conic-gradient(from 0deg, #ff4d4d, #f9cb28, #7cfc00, #00ffff, #4d4dff, #ff00ff, #ff4d4d)',
                    border: (state.deviceColor === 'original' && !state.clayMode) ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                  title="Original"
                >
                  <Smartphone size={14} color="#fff" />
                </button>

                {/* 2. Custom Color Picker */}
                {(() => {
                   const isPreset = ['original', 'titanium', 'black', 'white', 'blue', 'naturallight', 'desert', 'sierra', 'clay'].includes(state.deviceColor);
                   const isActive = !isPreset;
                   
                   return (
                     <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                       <button 
                         style={{ 
                           width: 34, height: 34, borderRadius: '50%', 
                           background: isActive ? state.deviceColor : 'conic-gradient(#ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff00ff, #ff0000)',
                           border: isActive ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', 
                           cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                           overflow: 'hidden'
                         }}
                         title="Color Personalizado"
                       >
                         <Plus size={14} color="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                         <input 
                           type="color" 
                           value={isActive ? state.deviceColor : '#71717a'} 
                           onChange={(e) => updateState({ deviceColor: e.target.value, clayMode: false })}
                           style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                         />
                       </button>
                     </div>
                   );
                })()}

                {/* 3+. Preset Colors */}
                {IPHONE_COLORS.filter(c => c.id !== 'original').map(c => {
                  const isActive = state.deviceColor === c.id;
                  return (
                    <button key={c.id} title={c.label} onClick={() => updateState({ deviceColor: c.id, clayMode: false })}
                      style={{
                        width: 34, height: 34, borderRadius: '50%', background: c.bg, flexShrink: 0,
                        border: isActive ? '2.5px solid #fff' : `1.5px solid ${c.border}`,
                        cursor: 'pointer'
                      }} />
                  );
                })}
              </div>
          </Section>
        </div>
      )}

      {(!isMobile || state.deviceSubTab === 'orientation' || state.deviceSubTab === 'browser-theme') && (hasOrientation || hasBrowserTheme) && (
        <div style={{ borderTop: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)', marginTop: isMobile ? 0 : 24, paddingTop: isMobile ? 0 : 20 }}>
          <Section label={hasBrowserTheme ? 'Tema Navegador' : 'Orientación'}>
              <div style={{ display: 'flex', gap: 10 }}>
                {hasOrientation && (
                  <>
                    <button onClick={() => updateState({ deviceLandscape: false })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: !state.deviceLandscape ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                        color: !state.deviceLandscape ? '#fff' : 'rgba(255,255,255,0.4)',
                        border: !state.deviceLandscape ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      }}>Vertical</button>
                    <button onClick={() => updateState({ deviceLandscape: true })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: state.deviceLandscape ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                        color: state.deviceLandscape ? '#fff' : 'rgba(255,255,255,0.4)',
                        border: state.deviceLandscape ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      }}>Horizontal</button>
                  </>
                )}
                {hasBrowserTheme && (
                  <>
                    <button onClick={() => updateState({ browserMode: 'light' })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: state.browserMode === 'light' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                        color: state.browserMode === 'light' ? '#fff' : 'rgba(255,255,255,0.4)',
                        border: state.browserMode === 'light' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      }}>Claro</button>
                    <button onClick={() => updateState({ browserMode: 'dark' })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: state.browserMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                        color: state.browserMode === 'dark' ? '#fff' : 'rgba(255,255,255,0.4)',
                        border: state.browserMode === 'dark' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      }}>Oscuro</button>
                  </>
                )}
              </div>
          </Section>
        </div>
      )}
    </div>
  );
};
