import React from "react";
import {
  EffectComposer,
  Bloom,
  SMAA,
  DepthOfField,
  SSAO,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { useApp } from "../../../store";

// ── Post-processing (bloom + DoF + SSAO + Vignette) ────────────────────
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
  const { state } = useApp();
  const base = hasContent ? 0.22 : 0.08;
  const scaled = base * (bloomIntensity / 22);

  const vignInt = state.bgVignette ? (state.bgVignetteIntensity || 50) / 100 : 0;
  const grainInt = state.grain ? (state.grainIntensity || 35) / 1000 : 0;

  return (
    <EffectComposer multisampling={4}>
      <SMAA />
      
      {/* 1. Grounding: SSAO adds shadows in small crevices */}
      <SSAO 
        intensity={15}
        radius={0.05}
        luminanceInfluence={0.5}
        bias={0.02}
      />

      {/* 2. Light: Bloom for the "glow" of the screen and lights */}
      <Bloom
        luminanceThreshold={0.92}
        luminanceSmoothing={0.15}
        intensity={scaled}
        mipmapBlur
      />

      {/* 3. Focus: DSLR-style Focus Blur */}
      {dofEnabled && (
        <DepthOfField
          focusDistance={dofFocusDistance}
          focalLength={dofFocalLength}
          bokehScale={dofBokehScale}
        />
      )}

      {/* 4. Atmosphere: Vignette and Grain */}
      {vignInt > 0 && <Vignette eskil={false} offset={0.1} darkness={vignInt * 1.2} />}
      {grainInt > 0 && <Noise opacity={grainInt} />}
    </EffectComposer>
  );
}

