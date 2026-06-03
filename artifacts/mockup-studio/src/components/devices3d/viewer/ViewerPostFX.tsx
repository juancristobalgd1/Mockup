import React, { useMemo } from "react";
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
import { detectDeviceProfile, getOptimizedConfig } from "../../../utils/performance";

// ── Post-processing (bloom + DoF + SSAO + Vignette) with performance optimization ────
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

  // Get performance config for adaptive rendering
  const { perfConfig, tier } = useMemo(() => {
    const profile = detectDeviceProfile();
    const config = getOptimizedConfig(profile);
    return { perfConfig: config, tier: profile.tier };
  }, []);

  const base = hasContent ? 0.22 : 0.08;
  const scaled = base * (bloomIntensity / 22);

  const vignInt = state.bgVignette ? (state.bgVignetteIntensity || 50) / 100 : 0;
  const grainInt = state.grain ? (state.grainIntensity || 35) / 1000 : 0;

  const effects: React.ReactNode[] = [];

  // SMAA is always enabled for visual quality
  effects.push(<SMAA key="smaa" />);

  // SSAO — expensive, skip on low-end devices
  if (perfConfig.enableSSAO) {
    effects.push(
      <SSAO
        key="ssao"
        intensity={tier === 'high' ? 15 : 8}
        radius={tier === 'high' ? 0.05 : 0.03}
        luminanceInfluence={0.5}
        bias={0.02}
      />
    );
  }

  // Bloom — expensive, reduce on low/medium devices
  if (perfConfig.enableBloom) {
    effects.push(
      <Bloom
        key="bloom"
        luminanceThreshold={0.92}
        luminanceSmoothing={0.15}
        intensity={tier === 'low' ? scaled * 0.5 : scaled}
        mipmapBlur={tier !== 'low'}
      />
    );
  }

  // Depth of field — very expensive, skip on non-high-end devices
  if (dofEnabled && perfConfig.enableDOF) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={dofFocusDistance}
        focalLength={dofFocalLength}
        bokehScale={dofBokehScale}
      />
    );
  }

  // Vignette — cheap, always enable
  if (vignInt > 0) {
    effects.push(
      <Vignette key="vignette" eskil={false} offset={0.1} darkness={vignInt * 1.2} />
    );
  }

  // Film grain — skip on low-end devices
  if (grainInt > 0 && tier !== 'low') {
    effects.push(<Noise key="noise" opacity={grainInt} />);
  }

  // Reduce multisampling on low-end devices for better performance
  const multisampling = tier === 'low' ? 0 : tier === 'medium' ? 2 : 4;

  return (
    <EffectComposer multisampling={multisampling}>
      {effects}
    </EffectComposer>
  );
}

