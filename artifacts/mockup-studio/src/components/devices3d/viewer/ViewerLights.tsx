import React from "react";
import * as THREE from "three";

// ── Per-environment light configs ─────────────────────────────────
export const ENV_LIGHTS: Record<
  string,
  {
    ambient: number;
    keyColor: string;
    keyIntensity: number;
    fillColor: string;
    fillIntensity: number;
    rimColor: string;
    rimIntensity: number;
    screenGlow: string;
  }
> = {
  studio: {
    ambient: 0.3,
    keyColor: "#ffffff",
    keyIntensity: 1.05,
    fillColor: "#d0e8ff",
    fillIntensity: 0.28,
    rimColor: "#e8eeff",
    rimIntensity: 0.65,
    screenGlow: "#8090ff",
  },
  warehouse: {
    ambient: 0.32,
    keyColor: "#ffe8c0",
    keyIntensity: 0.95,
    fillColor: "#c8d8ff",
    fillIntensity: 0.24,
    rimColor: "#d0e0ff",
    rimIntensity: 0.55,
    screenGlow: "#6080ff",
  },
  city: {
    ambient: 0.26,
    keyColor: "#c0d8ff",
    keyIntensity: 0.8,
    fillColor: "#ffd090",
    fillIntensity: 0.2,
    rimColor: "#8090ff",
    rimIntensity: 0.6,
    screenGlow: "#4060ff",
  },
  sunset: {
    ambient: 0.24,
    keyColor: "#ff9050",
    keyIntensity: 1.0,
    fillColor: "#ffd080",
    fillIntensity: 0.26,
    rimColor: "#ff7040",
    rimIntensity: 0.65,
    screenGlow: "#ff8040",
  },
  forest: {
    ambient: 0.3,
    keyColor: "#d0ffb0",
    keyIntensity: 0.8,
    fillColor: "#a0e8a0",
    fillIntensity: 0.2,
    rimColor: "#c0ffc0",
    rimIntensity: 0.45,
    screenGlow: "#60c060",
  },
  night: {
    ambient: 0.14,
    keyColor: "#2040a0",
    keyIntensity: 0.4,
    fillColor: "#101830",
    fillIntensity: 0.12,
    rimColor: "#4060c0",
    rimIntensity: 0.38,
    screenGlow: "#4060ff",
  },
};

// ── Warmth color shift ────────────────────────────────────────────
export function warmColor(hex: string, warmth: number): string {
  const c = new THREE.Color(hex);
  const t = warmth / 50; // -1 … +1
  c.r = Math.min(1, Math.max(0, c.r + t * 0.3));
  c.g = Math.min(1, Math.max(0, c.g + t * 0.04));
  c.b = Math.min(1, Math.max(0, c.b - t * 0.38));
  return `#${c.getHexString()}`;
}

// ── Studio lights  (Rotato-style, env-aware) ──────────────────────
export function StudioLights({
  deviceType,
  envPreset,
  brightness,
  ambient,
  warmth,
}: {
  deviceType: string;
  envPreset: string;
  brightness: number;
  ambient: number;
  warmth: number;
}) {
  const isLaptop = deviceType === "macbook";
  const cfg = ENV_LIGHTS[envPreset] ?? ENV_LIGHTS.studio;

  // brightness 0-100 → multiplier (50 = 1.0×, 0 = 0×, 100 = 2.0×)
  const bMul = brightness / 50;
  // ambient 0-100 → intensity
  const ambVal = cfg.ambient * (ambient / 50);

  return (
    <>
      <ambientLight intensity={ambVal} />
      <directionalLight
        position={[3.5, 7, 5]}
        intensity={cfg.keyIntensity * bMul}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        color={warmColor(cfg.keyColor, warmth)}
      />
      <directionalLight
        position={[-4, 2, 3]}
        intensity={cfg.fillIntensity * bMul}
        color={warmColor(cfg.fillColor, warmth * 0.5)}
      />
      <directionalLight
        position={[-2, 4, -5]}
        intensity={
          (isLaptop ? cfg.rimIntensity * 0.7 : cfg.rimIntensity) * bMul
        }
        color={warmColor(cfg.rimColor, warmth * 0.3)}
      />
      <pointLight
        position={[0, -3, 2]}
        intensity={ambVal * 0.8}
        color="#ffe0c0"
      />
      <pointLight
        position={[0, 0, 3]}
        intensity={0.18}
        color={cfg.screenGlow}
        distance={6}
        decay={2}
      />

      {/* ── Studio Softboxes (Invisible planes that create reflections) ── */}
      <group>
        {/* Main top-right key softbox */}
        <StudioSoftbox position={[4, 5, 2]} rotation={[0, -Math.PI / 4, 0]} width={2} height={8} intensity={2} />
        {/* Side fill softbox for long edge highlights */}
        <StudioSoftbox position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} width={1} height={10} intensity={1} />
        {/* Rim softbox for back edge separation */}
        <StudioSoftbox position={[0, 4, -5]} rotation={[Math.PI, 0, 0]} width={6} height={2} intensity={1.5} />
      </group>
    </>
  );
}

function StudioSoftbox({ position, rotation, width, height, intensity }: { 
  position: [number, number, number], 
  rotation: [number, number, number],
  width: number,
  height: number,
  intensity: number
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial 
        color="white" 
        emissive="white" 
        emissiveIntensity={intensity} 
        transparent 
        opacity={0} // Invisible to camera
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

