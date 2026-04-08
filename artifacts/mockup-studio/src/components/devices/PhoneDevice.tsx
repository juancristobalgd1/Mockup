import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';
import { getModelById } from '../../data/devices';
import type { DeviceModelDef } from '../../data/devices';

const IPHONE_FRAMES: Record<string, { body: string; border: string; btn: string }> = {
  titanium: { body: 'linear-gradient(145deg, #3a3a3a 0%, #1e1e1e 50%, #111 100%)', border: '#4a4a4a', btn: '#3a3a3a' },
  black:    { body: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 50%, #050505 100%)', border: '#2a2a2a', btn: '#1a1a1a' },
  white:    { body: 'linear-gradient(145deg, #d8d8d8 0%, #c4c4c4 50%, #b0b0b0 100%)', border: '#b8b8b8', btn: '#c8c8c8' },
  blue:     { body: 'linear-gradient(145deg, #2a3f6f 0%, #1a2f5f 50%, #0f1e40 100%)', border: '#3a5080', btn: '#2a3f6f' },
};

const ANDROID_FRAMES: Record<string, { body: string; border: string; btn: string }> = {
  titanium:  { body: 'linear-gradient(145deg, #36393e 0%, #1a1c20 60%, #0e1012 100%)', border: '#454850', btn: '#2a2d32' },
  aluminum:  { body: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 60%, #0f0f0f 100%)', border: '#404040', btn: '#2a2a2a' },
  glass:     { body: 'linear-gradient(145deg, #232323 0%, #161616 50%, #0d0d0d 100%)', border: '#333', btn: '#202020' },
};

function getFrameStyle(def: DeviceModelDef, deviceType: string, deviceColor: string) {
  if (deviceType === 'iphone') {
    return IPHONE_FRAMES[deviceColor] ?? IPHONE_FRAMES.titanium;
  }
  const androidFrame = def.frame === 'titanium' ? ANDROID_FRAMES.titanium : def.frame === 'glass' ? ANDROID_FRAMES.glass : ANDROID_FRAMES.aluminum;
  return androidFrame;
}

function DynamicIsland({ isLandscape }: { isLandscape: boolean }) {
  if (isLandscape) {
    return (
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 10, width: 16, height: 42, background: '#000', borderRadius: 8, zIndex: 10, pointerEvents: 'none',
      }} />
    );
  }
  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      width: 86, height: 22, background: '#000', borderRadius: 11, zIndex: 10, pointerEvents: 'none',
    }} />
  );
}

function Notch({ isLandscape }: { isLandscape: boolean }) {
  if (isLandscape) {
    return (
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 0, width: 20, height: 60, background: '#000',
        borderRadius: '0 0 6px 6px', zIndex: 10, pointerEvents: 'none',
      }} />
    );
  }
  return (
    <div style={{
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: 120, height: 26, background: '#000', borderRadius: '0 0 20px 20px', zIndex: 10, pointerEvents: 'none',
    }} />
  );
}

function PunchHole({ isLandscape }: { isLandscape: boolean }) {
  const top = isLandscape ? '50%' : 14;
  const left = isLandscape ? undefined : '50%';
  const right = isLandscape ? 14 : undefined;
  return (
    <div style={{
      position: 'absolute',
      top, left, right,
      transform: isLandscape ? 'translateY(-50%)' : 'translateX(-50%)',
      width: 13, height: 13, background: '#000', borderRadius: '50%', zIndex: 10, pointerEvents: 'none',
    }} />
  );
}

export function PhoneDevice() {
  const { state } = useApp();
  const def = getModelById(state.deviceModel);
  const isLandscape = state.deviceLandscape && (def.hasOrientation ?? false);
  const frame = getFrameStyle(def, state.deviceType, state.deviceColor);

  const W = isLandscape ? def.h : def.w;
  const H = isLandscape ? def.w : def.h;

  const insetTop    = isLandscape ? def.insetSide : def.insetTop;
  const insetBottom = isLandscape ? def.insetSide : def.insetBottom;
  const insetLeft   = isLandscape ? def.insetBottom : def.insetSide;
  const insetRight  = isLandscape ? def.insetTop : def.insetSide;

  // Screen content accent based on device type
  const accentColor = state.deviceType === 'iphone' ? '#374151' : '#4ade80';
  const iconBg      = state.deviceType === 'iphone' ? 'rgba(55,65,81,0.1)' : 'rgba(34,197,94,0.2)';

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Body */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: def.br,
        background: frame.body,
        border: `1.5px solid ${frame.border}`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
      }} />

      {/* Frame highlight */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: def.br,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />

      {/* Side buttons */}
      {!isLandscape && (
        <>
          <div style={{ position: 'absolute', left: -3, top: Math.round(H * 0.22), width: 3, height: Math.round(H * 0.08), background: frame.btn, borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: Math.round(H * 0.33), width: 3, height: Math.round(H * 0.08), background: frame.btn, borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: Math.round(H * 0.16), width: 3, height: Math.round(H * 0.05), background: frame.btn, borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', right: -3, top: Math.round(H * 0.24), width: 3, height: Math.round(H * 0.14), background: frame.btn, borderRadius: '0 2px 2px 0' }} />
        </>
      )}

      {/* Screen */}
      <div style={{
        position: 'absolute',
        top: insetTop, left: insetLeft, right: insetRight, bottom: insetBottom,
        borderRadius: def.screenBr, overflow: 'hidden', background: '#080810',
      }}>
        <ScreenContent accentColor={accentColor} iconBg={iconBg} />
        {def.camera === 'dynamic-island' && <DynamicIsland isLandscape={isLandscape} />}
        {def.camera === 'notch' && <Notch isLandscape={isLandscape} />}
        {def.camera === 'punch-hole' && <PunchHole isLandscape={isLandscape} />}
      </div>
    </div>
  );
}
