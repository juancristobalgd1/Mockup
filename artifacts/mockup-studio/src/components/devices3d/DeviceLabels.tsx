import React from 'react';
import { Html } from '@react-three/drei';
import { useApp, type LabelAnchorPosition } from '../../store';

const LABEL_ANCHOR_VECTORS: Record<LabelAnchorPosition, { x: number, y: number }> = {
  'top': { x: 0, y: 1 },
  'top-right': { x: 1, y: 1 },
  'right': { x: 1, y: 0 },
  'bottom-right': { x: 1, y: -1 },
  'bottom': { x: 0, y: -1 },
  'bottom-left': { x: -1, y: -1 },
  'left': { x: -1, y: 0 },
  'top-left': { x: -1, y: 1 },
};

interface DeviceLabelsProps {
  sW: number;
  sH: number;
  sOffY: number;
  zPos: number;
  modelWidth?: number;
}

/**
 * DeviceLabels renders TextOverlays of kind 'label' directly in 3D space.
 * 
 * Re-structured to ensure:
 * 1. Labels live within the phone's coordinate system (local position).
 * 2. Automatic Front Alignment: By default they are parallel to the screen.
 * 3. Left-to-Right Reading: Standard HTML rendering on a 3D plane.
 */
export function DeviceLabels({ sW, sH, sOffY, zPos, modelWidth }: DeviceLabelsProps) {
  const { state } = useApp();
  const labels = state.texts.filter(t => t.kind === 'label');
  if (labels.length === 0) return null;

  // Determine chasis footprint in world units
  const halfW = Math.max(sW, modelWidth || 0) / 2;
  const halfH = sH / 2;

  return (
    <group position={[0, sOffY, zPos]}>
      {labels.map(label => {
        const anchor = label.labelAnchor || 'right';
        const vector = LABEL_ANCHOR_VECTORS[anchor];
        const isBillboard = label.labelMode === 'billboard';
        const isFixed = label.labelMode === 'fixed';
        
        // Offset mapping: 16 units in store -> ~0.2 world units
        const levitation = (label.levitation ?? 16) / 75;
        // Text gap scales with font size to avoid overlapping the anchor dot
        const textGap = levitation + (label.fontSize / 120);

        let x = 0;
        let y = 0;
        let textAlign: 'left' | 'right' | 'center' = 'center';
        
        if (isFixed) {
          x = (label.x / 100 - 0.5) * sW;
          y = (0.5 - label.y / 100) * sH;
        } else {
          x = halfW * vector.x * 1.05 + (vector.x !== 0 ? Math.sign(vector.x) * textGap : 0);
          y = halfH * vector.y * 1.05 + (vector.y !== 0 ? Math.sign(vector.y) * textGap : 0);
          textAlign = vector.x < 0 ? 'right' : vector.x > 0 ? 'left' : 'center';
        }

        return (
          <group key={label.id} position={[x, y, 0.02]}>
            <Html
              transform={!isBillboard}
              center
              distanceFactor={6}
              zIndexRange={[100, 0]}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{
                fontSize: label.fontSize,
                color: label.color,
                fontWeight: label.isBold ? 700 : 400,
                fontStyle: label.isItalic ? 'italic' : 'normal',
                textAlign,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                fontFamily: `${label.fontFamily || 'Inter'}, sans-serif`,
                letterSpacing: '-0.01em',
              }}>
                {label.text}
              </div>
            </Html>
            
          </group>
        );
      })}
    </group>
  );
}
