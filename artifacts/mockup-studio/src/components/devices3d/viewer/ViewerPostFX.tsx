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

  const effects = [
    <SMAA key="smaa" />,
    <SSAO 
      key="ssao"
      intensity={15}
      radius={0.05}
      luminanceInfluence={0.5}
      bias={0.02}
    />,
    <Bloom
      key="bloom"
      luminanceThreshold={0.92}
      luminanceSmoothing={0.15}
      intensity={scaled}
      mipmapBlur
    />
  ];

  if (dofEnabled) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={dofFocusDistance}
        focalLength={dofFocalLength}
        bokehScale={dofBokehScale}
      />
    );
  }

  if (vignInt > 0) {
    effects.push(<Vignette key="vignette" eskil={false} offset={0.1} darkness={vignInt * 1.2} />);
  }
  
  if (grainInt > 0) {
    effects.push(<Noise key="noise" opacity={grainInt} />);
  }

  return (
    <EffectComposer multisampling={4}>
      {effects}
    </EffectComposer>
  );
}

