
export const PRESET_PREVIEW_KEYFRAMES = `
@keyframes preset-preview-zoom-in {
  0% { transform: translate(-24px, 14px) rotate(-22deg) scale(0.68); }
  100% { transform: translate(4px, 4px) rotate(-8deg) scale(1.06); }
}
@keyframes preset-preview-zoom-out {
  0% { transform: translate(2px, 2px) rotate(-8deg) scale(1.05); }
  100% { transform: translate(-30px, 18px) rotate(-24deg) scale(0.6); }
}
@keyframes preset-preview-orbit {
  0% { transform: translate(-28px, 8px) rotate(-24deg) scale(0.82); }
  25% { transform: translate(6px, -6px) rotate(-8deg) scale(0.98); }
  50% { transform: translate(26px, 6px) rotate(8deg) scale(0.82); }
  75% { transform: translate(2px, 16px) rotate(16deg) scale(0.72); }
  100% { transform: translate(-28px, 8px) rotate(-24deg) scale(0.82); }
}
@keyframes preset-preview-reveal-below {
  0% { transform: translate(-8px, 68px) rotate(-8deg) scale(0.78); opacity: 0.25; }
  55% { transform: translate(-2px, 8px) rotate(-6deg) scale(0.94); opacity: 1; }
  100% { transform: translate(6px, 2px) rotate(-4deg) scale(1.04); opacity: 1; }
}
@keyframes preset-preview-overhead {
  0% { transform: translate(0px, -34px) rotate(-2deg) scale(0.55); }
  55% { transform: translate(0px, -6px) rotate(-3deg) scale(0.82); }
  100% { transform: translate(0px, 6px) rotate(-4deg) scale(1.02); }
}
@keyframes preset-preview-cinematic-push {
  0% { transform: translate(-18px, 12px) rotate(-16deg) scale(0.74); }
  100% { transform: translate(18px, -2px) rotate(-6deg) scale(1.08); }
}
@keyframes preset-preview-side-sweep {
  0% { transform: translate(-58px, 8px) rotate(-18deg) scale(0.88); }
  50% { transform: translate(0px, 0px) rotate(-10deg) scale(1); }
  100% { transform: translate(58px, 8px) rotate(-2deg) scale(0.88); }
}
@keyframes preset-preview-hero-arc {
  0% { transform: translate(-44px, -18px) rotate(-24deg) scale(0.72); }
  55% { transform: translate(-10px, 2px) rotate(-11deg) scale(0.92); }
  100% { transform: translate(10px, 10px) rotate(-3deg) scale(1.04); }
}
@keyframes preset-preview-spiral-in {
  0% { transform: translate(34px, -18px) rotate(18deg) scale(0.58); }
  25% { transform: translate(-24px, -14px) rotate(-18deg) scale(0.72); }
  50% { transform: translate(16px, 8px) rotate(10deg) scale(0.84); }
  75% { transform: translate(-10px, 4px) rotate(-8deg) scale(0.95); }
  100% { transform: translate(2px, 3px) rotate(-4deg) scale(1.04); }
}
@keyframes preset-preview-whip-pan {
  0% { transform: translate(-66px, 6px) rotate(-24deg) scale(0.94); }
  55% { transform: translate(38px, 2px) rotate(4deg) scale(0.92); }
  100% { transform: translate(10px, 4px) rotate(-6deg) scale(1.02); }
}
@keyframes preset-preview-float-rise {
  0% { transform: translate(-18px, 22px) rotate(-14deg) scale(0.84); }
  50% { transform: translate(8px, -2px) rotate(-7deg) scale(0.96); }
  100% { transform: translate(-4px, -14px) rotate(-2deg) scale(1.03); }
}
@keyframes preset-preview-dot {
  0%, 100% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}
@keyframes tpl-product-showcase {
  0%   { transform: translate(-22px, 20px) rotate(-20deg) scale(0.55); }
  25%  { transform: translate(0px, 0px) rotate(-8deg) scale(1); }
  50%  { transform: translate(22px, -4px) rotate(6deg) scale(0.92); }
  75%  { transform: translate(-18px, -2px) rotate(-14deg) scale(0.9); }
  100% { transform: translate(4px, 4px) rotate(-6deg) scale(0.96); }
}
@keyframes tpl-app-store-preview {
  0%   { transform: translate(0px, 4px) rotate(-6deg) scale(0.58); }
  30%  { transform: translate(2px, 0px) rotate(-8deg) scale(1.08); }
  55%  { transform: translate(24px, 2px) rotate(6deg) scale(0.88); }
  75%  { transform: translate(-4px, -2px) rotate(-6deg) scale(1); }
  100% { transform: translate(0px, 2px) rotate(-4deg) scale(0.82); }
}
@keyframes tpl-social-spin {
  0%   { transform: translate(-26px, 4px) rotate(-22deg) scale(0.82); }
  25%  { transform: translate(4px, -6px) rotate(-6deg) scale(0.98); }
  50%  { transform: translate(26px, 4px) rotate(10deg) scale(0.82); }
  75%  { transform: translate(2px, 12px) rotate(18deg) scale(0.72); }
  100% { transform: translate(-26px, 4px) rotate(-22deg) scale(0.82); }
}
@keyframes tpl-hero-landing {
  0%   { transform: translate(0px, -48px) rotate(-2deg) scale(0.45); opacity: 0.3; }
  40%  { transform: translate(-6px, 2px) rotate(-6deg) scale(0.9); opacity: 1; }
  70%  { transform: translate(4px, 4px) rotate(-4deg) scale(1.06); opacity: 1; }
  100% { transform: translate(2px, 6px) rotate(-4deg) scale(0.94); opacity: 1; }
}
@keyframes tpl-presentation {
  0%   { transform: translate(-2px, 2px) rotate(-10deg) scale(1.14); }
  20%  { transform: translate(0px, 0px) rotate(-6deg) scale(1); }
  45%  { transform: translate(0px, 0px) rotate(-6deg) scale(1); }
  60%  { transform: translate(24px, 2px) rotate(5deg) scale(0.92); }
  80%  { transform: translate(24px, 2px) rotate(5deg) scale(0.92); }
  95%  { transform: translate(4px, 2px) rotate(-4deg) scale(0.88); }
  100% { transform: translate(4px, 2px) rotate(-4deg) scale(0.88); }
}
`;

export function PresetPreview({ presetId }: { presetId: string }) {
  const animationName = `preset-preview-${presetId}`;
  const showPath = presetId === 'side-sweep' || presetId === 'orbit' || presetId === 'cinematic-push' || presetId === 'whip-pan' || presetId === 'hero-arc' || presetId === 'spiral-in';
  const showVerticalGuide = presetId === 'reveal-below' || presetId === 'overhead' || presetId === 'float-rise';

  return (
    <div
      aria-hidden="true"
      style={{
        width: 128,
        height: 72,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #b7b7b7 0%, #a9a9a9 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.14) 43%, rgba(0,0,0,0.14) 100%)',
        }}
      />
      {showPath && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: presetId === 'orbit' ? 16 : presetId === 'hero-arc' ? 22 : presetId === 'spiral-in' ? 18 : 36,
            height: presetId === 'orbit' ? 24 : presetId === 'hero-arc' ? 18 : presetId === 'spiral-in' ? 28 : 1,
            border: presetId === 'orbit' || presetId === 'hero-arc' || presetId === 'spiral-in' ? '1px dashed rgba(255,255,255,0.22)' : 'none',
            borderTop: presetId !== 'orbit' && presetId !== 'hero-arc' && presetId !== 'spiral-in' ? '1px dashed rgba(255,255,255,0.22)' : undefined,
            borderRadius: presetId === 'orbit' || presetId === 'hero-arc' || presetId === 'spiral-in' ? 999 : 0,
          }}
        />
      )}
      {showVerticalGuide && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 10,
            bottom: 10,
            width: 1,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 56,
          height: 108,
          marginLeft: -28,
          marginTop: -54,
          borderRadius: 14,
          border: '4px solid #171717',
          background: '#f6f6f6',
          boxShadow: '0 7px 16px rgba(0,0,0,0.3)',
          transformOrigin: '50% 50%',
          animation: `${animationName} 2.6s cubic-bezier(0.45, 0.05, 0.2, 1) infinite alternate`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 7,
            left: '50%',
            width: 18,
            height: 4,
            borderRadius: 999,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.16)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 0 10px rgba(255,255,255,0.25)',
          animation: 'preset-preview-dot 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

const TPL_COLORS: Record<string, { bg: string; accent: string }> = {
  'product-showcase':  { bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', accent: 'rgba(139,92,246,0.35)' },
  'app-store-preview': { bg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', accent: 'rgba(59,130,246,0.35)' },
  'social-spin':       { bg: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)', accent: 'rgba(244,63,94,0.35)' },
  'hero-landing':      { bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', accent: 'rgba(245,158,11,0.35)' },
  'presentation':      { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accent: 'rgba(16,185,129,0.35)' },
};

export function TemplatePreview({ templateId }: { templateId: string }) {
  const colors = TPL_COLORS[templateId] ?? { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', accent: 'rgba(139,92,246,0.35)' };
  const isSpin = templateId === 'social-spin';
  const isLanding = templateId === 'hero-landing';
  const isPresentation = templateId === 'presentation';

  return (
    <div
      aria-hidden="true"
      style={{
        width: 128,
        height: 72,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        background: colors.bg,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.18) 100%)' }} />
      {/* Guide path */}
      {isSpin && (
        <div style={{
          position: 'absolute', left: 14, right: 14, top: 16, height: 24,
          border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 999,
        }} />
      )}
      {isLanding && (
        <div style={{
          position: 'absolute', left: '50%', top: 6, bottom: 10, width: 1,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))',
        }} />
      )}
      {isPresentation && (
        <div style={{
          position: 'absolute', left: 14, right: 14, top: 36, height: 1,
          borderTop: '1px dashed rgba(255,255,255,0.2)',
        }} />
      )}
      {/* Animated phone */}
      <div
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: 56, height: 108,
          marginLeft: -28, marginTop: -54,
          borderRadius: 14,
          border: '4px solid #171717',
          background: '#f6f6f6',
          boxShadow: '0 7px 16px rgba(0,0,0,0.3)',
          transformOrigin: '50% 50%',
          animation: `tpl-${templateId} ${isSpin ? '2.2s' : '3s'} cubic-bezier(0.45, 0.05, 0.2, 1) infinite ${isSpin ? 'linear' : 'alternate'}`,
        }}
      >
        <div style={{
          position: 'absolute', top: 7, left: '50%', width: 18, height: 4,
          borderRadius: 999, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.16)',
        }} />
      </div>
      {/* Pulsing dot */}
      <div style={{
        position: 'absolute', right: 12, top: 12, width: 7, height: 7,
        borderRadius: '50%', background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 0 10px rgba(255,255,255,0.25)',
        animation: 'preset-preview-dot 1.8s ease-in-out infinite',
      }} />
      {/* Duration badge */}
    </div>
  );
}
