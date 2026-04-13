import * as React from 'react';

interface GridOverlayProps {
  color?: string;
  size?: number;
  opacity?: number;
}

export function GridOverlay({
  color = 'rgba(255, 255, 255, 0.1)',
  size = 40,
  opacity = 1
}: GridOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        opacity,
        backgroundImage: `
          linear-gradient(to right, ${color} 1px, transparent 1px),
          linear-gradient(to bottom, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: 'center center',
      }}
      aria-hidden="true"
    >
      {/* Central Crosshairs */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'rgba(255, 69, 58, 0.4)', /* rt-accent-red but faint */
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '1px',
          background: 'rgba(255, 69, 58, 0.4)',
        }}
      />
    </div>
  );
}
