import React from "react";
import {
  EffectComposer,
  Bloom,
  SMAA,
  DepthOfField,
} from "@react-three/postprocessing";

// ── Post-processing (bloom + DoF for screen) ────────────────────
export function PostFX({
  hasContent,
  bloomIntensity,
  dofEnabled,
  dofFocusDistance,
  dofFocalLength,
  dofBokehScale,
}: {
  hasContent: boolean;
  bloomIntensity: number;
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;
}) {
  const base = hasContent ? 0.22 : 0.08;
  const scaled = base * (bloomIntensity / 22);
  if (dofEnabled) {
    return (
      <EffectComposer multisampling={4}>
        <SMAA />
        <Bloom
          luminanceThreshold={0.94}
          luminanceSmoothing={0.4}
          intensity={scaled}
          mipmapBlur
        />
        <DepthOfField
          focusDistance={dofFocusDistance}
          focalLength={dofFocalLength}
          bokehScale={dofBokehScale}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4}>
      <SMAA />
      <Bloom
        luminanceThreshold={0.94}
        luminanceSmoothing={0.4}
        intensity={scaled}
        mipmapBlur
      />
    </EffectComposer>
  );
}
