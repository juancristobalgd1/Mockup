import React, { Component, useRef, type ReactNode } from "react";
import { Html, useGLTF, useProgress } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Loading indicator ─────────────────────────────────────────────
export function Loader() {
  const { progress } = useProgress();
  if (progress >= 100) return null;
  return (
    <Html center>
      <div
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          fontFamily: "system-ui",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 120,
            height: 2,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 1,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "rgba(255,255,255,0.5)",
              borderRadius: 1,
              transition: "width 0.3s",
            }}
          />
        </div>
        Cargando
      </div>
    </Html>
  );
}

// ── Model load failure ───────────────────────────────────────────
// A model that fails to load (e.g. a dropped network request) shows a retry
// message in the scene instead of taking down the whole 3D viewer. The failed
// request is evicted from the GLTF cache so a retry or a device switch refetches it.
export class ModelLoadBoundary extends Component<
  { glbUrl?: string; resetKey: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    if (this.props.glbUrl) useGLTF.clear(this.props.glbUrl);
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Html center>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderRadius: 14,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontFamily: "system-ui",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          No se pudo cargar el modelo
          <button
            onClick={() => this.setState({ failed: false })}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              background: "#fff",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </Html>
    );
  }
}

// ── Hint overlay ─────────────────────────────────────────────────
export function RotatoHint({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "5px 14px",
        fontSize: 11,
        color: "rgba(255,255,255,0.45)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        zIndex: 5,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      ⌖ Mover para desplazar · Zoom para ajustar el tamaño
    </div>
  );
}

// ── GL / scene capture helper ─────────────────────────────────────
export function SceneCapturer({
  onReady,
}: {
  onReady: (
    gl: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene,
  ) => void;
}) {
  const { gl, camera, scene } = useThree();
  onReady(gl, camera, scene);
  return null;
}

// ── Reactive exposure control ──────────────────────────────────────
export function ExposureControl({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  React.useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

/** Professional Camera Lens Shift (Composition Pan) */
export function LensShift({ px, py }: { px: number; py: number }) {
  const { camera, size } = useThree();
  useFrame(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.setViewOffset(
        size.width,
        size.height,
        -px,
        -py,
        size.width,
        size.height,
      );
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

export function SpinWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (ref.current) {
      ref.current.rotation.y = st.clock.elapsedTime * 0.4;
    }
  });
  return <group ref={ref}>{children}</group>;
}

export function PulseWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (ref.current) {
      const s = 1 + Math.sin(st.clock.elapsedTime * 2) * 0.025;
      ref.current.scale.set(s, s, s);
    }
  });
  return <group ref={ref}>{children}</group>;
}
