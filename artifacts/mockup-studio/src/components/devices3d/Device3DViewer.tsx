import React, {
  Suspense,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Canvas as R3FCanvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  useProgress,
  Html,
  useGLTF,
  RoundedBox,
  MeshReflectorMaterial,
  GizmoHelper,
  GizmoViewport,
  Hud,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  SMAA,
  DepthOfField,
} from "@react-three/postprocessing";
import * as THREE from "three";
import {
  useApp,
  type AppState,
  type TextOverlay,
  type DeviceColor,
  type LabelAnchorPosition,
} from "../../store";
import type { CameraKeyframe } from "../../store";
import { getModelById, DEVICE_MODELS } from "../../data/devices";
import { useIsMobile } from "../../hooks/use-mobile";
import { useScreenTexture } from "./useScreenTexture";
import { getGlobalScreenTexture } from "./textureGlobal";
import { Phone3DModel } from "./Phone3DModel";
import { GLBDeviceModel } from "./GLBDeviceModel";
import { Tablet3DModel } from "./Tablet3DModel";
import { MacBook3DModel } from "./MacBook3DModel";
import { Watch3DModel } from "./Watch3DModel";
import { DeviceLabels } from "./DeviceLabels";

// Auto-preload every GLB model declared in devices.ts.
// Adding a new device with a glbUrl here is all that is needed —
// no manual preload line required.
DEVICE_MODELS.forEach((m) => {
  if (m.glbUrl) useGLTF.preload(m.glbUrl);
});

export interface Device3DViewerHandle {
  getGLElement: () => HTMLCanvasElement | null;
  getCameraState: () => {
    position: [number, number, number];
    target: [number, number, number];
  } | null;
  /** Synchronously drive camera to keyframe position at `time` seconds and re-render to glEl. */
  renderAt: (time: number) => void;
}

export type InteractionMode = "none" | "drag" | "zoom";

const ZOOM_SLIDER_MIN = 0;
const ZOOM_SLIDER_MAX = 100;

function clampZoomSlider(value: number) {
  return Math.min(ZOOM_SLIDER_MAX, Math.max(ZOOM_SLIDER_MIN, value));
}

function distanceToZoomValue(
  distance: number,
  minDistance: number,
  maxDistance: number,
) {
  const span = Math.max(0.0001, maxDistance - minDistance);
  const normalized = (distance - minDistance) / span;
  return clampZoomSlider((1 - normalized) * 100);
}

function zoomValueToDistance(
  value: number,
  minDistance: number,
  maxDistance: number,
) {
  const zoomValue = clampZoomSlider(value);
  const normalized = 1 - zoomValue / 100;
  return minDistance + (maxDistance - minDistance) * normalized;
}

// ── Loading indicator ─────────────────────────────────────────────
function Loader() {
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
        Loading
      </div>
    </Html>
  );
}

// ── Hint overlay ─────────────────────────────────────────────────
function RotatoHint({ visible }: { visible: boolean }) {
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
      ⌖ Move para desplazar · Zoom para abrir el slider
    </div>
  );
}

// ── GL / scene capture helper ─────────────────────────────────────
function SceneCapturer({
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
// Updating gl.toneMappingExposure must happen inside the canvas context.
function ExposureControl({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

/** Professional Camera Lens Shift (Composition Pan)
 * This allows shifting the projection center so the device moves on screen
 * while the 3D rotation center remains perfectly at (0,0,0).
 */
function LensShift({ px, py }: { px: number; py: number }) {
  const { camera, size } = useThree();
  useFrame(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      // We use setViewOffset to shift the viewport within a virtual larger screen.
      // -px, -py shifts the "film" in the opposite direction of the desired movement.
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

// ── Per-preset HDR environment intensity ───────────────────────────
// Kept in the 1.0–1.6 range: enough for realistic reflections without
// compounding with the direct lights to create overexposure.
const ENV_INTENSITY: Record<string, number> = {
  studio: 1.0,
  warehouse: 1.12,
  city: 0.96,
  sunset: 1.04,
  forest: 0.9,
  night: 0.72,
};

// ── Per-environment light configs ─────────────────────────────────
// Reference: a real studio uses one key at ~1.0, fill at ~0.3, rim at ~0.5.
// Ambient is raised slightly so dark-side surfaces stay readable.
const ENV_LIGHTS: Record<
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
// Blends a base hex color toward warm orange (+) or cool blue (-).
// warmth: -50 = max cool, 0 = neutral, +50 = max warm.
function warmColor(hex: string, warmth: number): string {
  const c = new THREE.Color(hex);
  const t = warmth / 50; // -1 … +1
  c.r = Math.min(1, Math.max(0, c.r + t * 0.3));
  c.g = Math.min(1, Math.max(0, c.g + t * 0.04));
  c.b = Math.min(1, Math.max(0, c.b - t * 0.38));
  return `#${c.getHexString()}`;
}

// ── Studio lights  (Rotato-style, env-aware) ──────────────────────
function StudioLights({
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
      {/* Ambient — fills shadows, scaled by Ambiente slider */}
      <ambientLight intensity={ambVal} />

      {/* Key light — main front-left, scaled by Brillo, tinted by Temperatura */}
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

      {/* Fill light — softer, also tinted by temperature */}
      <directionalLight
        position={[-4, 2, 3]}
        intensity={cfg.fillIntensity * bMul}
        color={warmColor(cfg.fillColor, warmth * 0.5)}
      />

      {/* Rim light — edge highlight, subtle warmth */}
      <directionalLight
        position={[-2, 4, -5]}
        intensity={
          (isLaptop ? cfg.rimIntensity * 0.7 : cfg.rimIntensity) * bMul
        }
        color={warmColor(cfg.rimColor, warmth * 0.3)}
      />

      {/* Subtle under-fill — stays neutral */}
      <pointLight
        position={[0, -3, 2]}
        intensity={ambVal * 0.8}
        color="#ffe0c0"
      />

      {/* Screen glow — always on, independent of brightness */}
      <pointLight
        position={[0, 0, 3]}
        intensity={0.18}
        color={cfg.screenGlow}
        distance={6}
        decay={2}
      />
    </>
  );
}

// ── Post-processing (bloom + DoF for screen) ────────────────────
function PostFX({
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

// ── Floor reflector (Rotato-style mirror floor) ───────────────────
function FloorReflector({ isLaptop }: { isLaptop: boolean }) {
  const { state } = useApp();
  if (!state.reflection) return null;
  const y = isLaptop ? -0.81 : -2.01;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[30, 30]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={512}
        mixBlur={6}
        mixStrength={(state.reflectionOpacity / 100) * 1.4}
        roughness={0.85}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0d0e0f"
        metalness={0.5}
        mirror={0}
      />
    </mesh>
  );
}

// ── Clay mode — replace all device materials with single matte color ─
function ClayOverride({ enabled, color }: { enabled: boolean; color: string }) {
  const { scene } = useThree();
  const clayMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const originalMaterialsRef = useRef<
    Map<THREE.Mesh, THREE.Material | THREE.Material[]>
  >(new Map());

  useEffect(() => {
    if (!clayMatRef.current) {
      clayMatRef.current = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 1,
        metalness: 0,
      });
    } else {
      clayMatRef.current.color.set(color);
    }
  }, [color]);

  useFrame(() => {
    if (!clayMatRef.current) return;
    const stored = originalMaterialsRef.current;

    if (enabled) {
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          // Skip floor reflector and screen planes (keep screen content visible)
          if (mesh.geometry?.type === "PlaneGeometry") return;
          if (!stored.has(mesh)) {
            stored.set(mesh, mesh.material);
          }
          if (mesh.material !== clayMatRef.current) {
            mesh.material = clayMatRef.current!;
          }
        }
      });
    } else if (stored.size > 0) {
      stored.forEach((origMat, mesh) => {
        if (mesh.material === clayMatRef.current) {
          mesh.material = origMat;
        }
      });
      stored.clear();
    }
  });

  return null;
}

// ── Drop-zone content for the device screen face ─────────────────
// Uses em units so it scales naturally with the container font-size
// (set imperatively from useFrame in DeviceScene).
function ScreenDropZoneContent({ pencil }: { pencil: boolean }) {
  const s = "rgba(255,255,255,0.95)";
  const label: React.CSSProperties = {
    fontSize: "0.9em",
    color: "rgba(255,255,255,0.92)",
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1,
  };
  return pencil ? (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.4em",
          height: "1.4em",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <svg
          width="0.9em"
          height="0.9em"
          viewBox="0 0 24 24"
          fill="none"
          stroke={s}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
      <span style={label}>Editar pantalla</span>
    </>
  ) : (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.4em",
          height: "1.4em",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <svg
          width="0.9em"
          height="0.9em"
          viewBox="0 0 24 24"
          fill="none"
          stroke={s}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span style={label}>Add media</span>
    </>
  );
}

// ── Device scene (all geometry) ───────────────────────────────────
function DeviceScene({
  floatEnabled,
  pencilVisible,
  onShowPencil,
  onHidePencil,
  screenTexture,
}: {
  floatEnabled: boolean;
  pencilVisible: boolean;
  onShowPencil: () => void;
  onHidePencil: () => void;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
}) {
  const { state, updateState } = useApp();
  const imageFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const def = getModelById(state.deviceModel);
  const isLandscape = state.deviceLandscape;
  const hasContent = !!(state.screenshotUrl || state.videoUrl);

  // ── Media menu state ─────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuUrl, setMenuUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [captureDelay, setCaptureDelay] = useState(0);

  const applyFile = (file: File) => {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      updateState({ videoUrl: url, screenshotUrl: null, contentType: "video" });
    } else {
      updateState({ screenshotUrl: url, videoUrl: null, contentType: "image" });
    }
    setMenuOpen(false);
  };

  const handleUrlCapture = () => {
    if (!menuUrl.trim()) return;
    setCaptureError("");
    setCapturing(true);

    // Compute screen aspect ratio from the current device model
    const screenW = def.w - def.insetSide * 2;
    const screenH = def.h - def.insetTop - def.insetBottom;
    const physW = isLandscape ? screenH : screenW;
    const physH = isLandscape ? screenW : screenH;
    const thumW = 1400;
    const thumH = Math.max(200, Math.round(thumW * (physH / physW)));

    let url = menuUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    const delaySegment =
      captureDelay > 0 ? `delay/${captureDelay * 1000}/` : "";
    const thumUrl = `https://image.thum.io/get/width/${thumW}/crop/${thumH}/noanimate/${delaySegment}${url}`;

    // Close modal after the user's selected wait time
    const closeDelay = captureDelay * 1000;
    setTimeout(() => {
      setMenuOpen(false);
      setMenuUrl("");
      setCapturing(false);
    }, closeDelay);

    // Load image in background; apply when ready
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      updateState({
        screenshotUrl: thumUrl,
        videoUrl: null,
        contentType: "image",
      });
    };
    img.onerror = () => {
      setCaptureError("Could not capture. Check the URL.");
      setCapturing(false);
    };
    img.src = thumUrl;
  };

  // Icon/plane position — screen center, slightly in front of device face
  const iconPos: [number, number, number] =
    state.deviceType === "macbook"
      ? [0, 0.28, 0.2]
      : state.deviceType === "browser"
        ? [0, -0.3, 0.08]
        : state.deviceType === "watch"
          ? [0, 0, 0.06]
          : [0, 0, 0.1];

  // Invisible click-plane dimensions (covers device screen area)
  const planeW =
    state.deviceType === "macbook"
      ? 2.2
      : state.deviceType === "browser"
        ? 3.2
        : state.deviceType === "ipad"
          ? 1.6
          : state.deviceType === "watch"
            ? 0.7
            : 0.85;
  const planeH =
    state.deviceType === "macbook"
      ? 1.4
      : state.deviceType === "browser"
        ? 2.0
        : state.deviceType === "ipad"
          ? 2.2
          : state.deviceType === "watch"
            ? 0.9
            : 1.65;

  // ── Face-detection + icon scaling ───────────────────────────────────
  // useFrame runs every frame to:
  //   1. Hide the icon when the camera is looking at the back face
  //   2. Scale the icon proportionally to the device's apparent screen size,
  //      so it stays in visual proportion as the user zooms in/out.
  //
  // Scaling strategy: project two world-space points that are 1 unit apart
  // at the device's current world position. The pixel distance between their
  // 2D projections tells us how many pixels per world unit at the current
  // zoom level. We use that to derive the icon diameter and apply it via
  // CSS transform: scale() — imperatively, with no React re-renders.
  const faceGroupRef = useRef<THREE.Group>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const _wn = useRef(new THREE.Vector3());
  const _wp = useRef(new THREE.Vector3());
  const _tc = useRef(new THREE.Vector3());
  const _q = useRef(new THREE.Quaternion());
  const _pjA = useRef(new THREE.Vector3());
  const _pjB = useRef(new THREE.Vector3());
  const _originProjected = useRef(new THREE.Vector3());

  useFrame(({ camera, gl }) => {
    if (!faceGroupRef.current || !wrapperRef.current) return;
    faceGroupRef.current.getWorldQuaternion(_q.current);
    faceGroupRef.current.getWorldPosition(_wp.current);
    _wn.current.set(0, 0, 1).applyQuaternion(_q.current);
    _tc.current.copy(camera.position).sub(_wp.current).normalize();
    const isFront = _wn.current.dot(_tc.current) > 0.05;
    wrapperRef.current.style.display = isFront ? "" : "none";

    // Derive how many CSS pixels correspond to 1 world unit at current zoom
    _pjA.current.copy(_wp.current).project(camera);
    _pjB.current
      .set(_wp.current.x + 1, _wp.current.y, _wp.current.z)
      .project(camera);
    const pxPerUnit =
      Math.abs(_pjB.current.x - _pjA.current.x) *
      (gl.domElement.clientWidth / 2);
    // Font-size drives the entire pill via em units; clamp so it's always legible
    const fs = Math.max(9, Math.min(16, pxPerUnit * 0.1));
    wrapperRef.current.style.fontSize = `${fs.toFixed(1)}px`;
  });

  // ── Show icon? ───────────────────────────────────────────────────
  const showIcon = !hasContent || pencilVisible;

  // ── Device renderer ───────────────────────────────────────────────
  // Priority 1: any device with a glbUrl is handled universally by GLBDeviceModel.
  //   → To add a new 3D device: drop the .glb in /public/models/ and add
  //     an entry with glbUrl in devices.ts. Nothing else needs to change here.
  // Priority 2: devices without a glbUrl fall back to a procedural model
  //   matched by storeType (browser frame, phone geometry, etc.).
  const inner = (() => {
    if (def.glbUrl) {
      return (
        <GLBDeviceModel
          def={def}
          deviceColor={state.deviceColor}
          screenTexture={screenTexture}
          contentType={state.contentType}
          isLandscape={isLandscape}
        />
      );
    }

    // Procedural fallbacks — only used when no glbUrl is set
    switch (state.deviceType) {
      case "browser":
        return (
          <BrowserFrame3D
            screenTexture={screenTexture}
            contentType={state.contentType}
            browserMode={def.id.includes("light") ? "light" : "dark"}
          />
        );
      case "ipad":
        return (
          <Tablet3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
            isLandscape={isLandscape}
          />
        );
      case "macbook":
        return (
          <MacBook3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        );
      case "watch":
        return (
          <Watch3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        );
      default:
        return (
          <Phone3DModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
            isLandscape={isLandscape}
          />
        );
    }
  })();

  // ── Html icon overlay ────────────────────────────────────────────
  // - The group at iconPos gives useFrame the correct world orientation
  //   to detect front vs back facing.
  // - Html (no transform) tracks the 3D point in screen space and
  //   renders at the correct 2D position — reliable DOM events.
  // - ONLY the small icon div has pointer-events:auto so OrbitControls
  //   is never blocked outside the tiny icon area.
  // - Direct DOM onClick on the icon → file picker ALWAYS opens
  //   (browser treats DOM click as a trusted user gesture).
  const overlay = (
    <group ref={faceGroupRef} position={iconPos}>
      <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
        {/* fontSize set by useFrame → everything inside scales via em */}
        <div
          ref={wrapperRef}
          style={{
            pointerEvents: "none",
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* ── Trigger pill ─────────────────────────────────────── */}
          {showIcon && (
            <div
              onClick={() => setMenuOpen((m) => !m)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = menuOpen
                  ? "rgba(50,52,70,0.96)"
                  : "rgba(40,42,54,0.92)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1.05)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(255,255,255,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = menuOpen
                  ? "rgba(30,32,44,0.94)"
                  : "rgba(10,10,16,0.76)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "scale(1)";
                (e.currentTarget as HTMLDivElement).style.borderColor = menuOpen
                  ? "rgba(255,255,255,0.28)"
                  : "rgba(255,255,255,0.20)";
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6em",
                padding: "0.5em 1em 0.5em 0.7em",
                borderRadius: "2.5em",
                background: menuOpen
                  ? "rgba(30,32,44,0.94)"
                  : "rgba(10,10,16,0.76)",
                border: `1px solid ${menuOpen ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.20)"}`,
                backdropFilter: "blur(16px)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                cursor: "pointer",
                userSelect: "none",
                pointerEvents: "auto",
                transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                whiteSpace: "nowrap",
              }}
            >
              <svg
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0, opacity: 0.85 }}
              >
                {pencilVisible ? (
                  <path
                    d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5L11.5 2.5z"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <>
                    <line
                      x1="8"
                      y1="3"
                      x2="8"
                      y2="13"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="3"
                      y1="8"
                      x2="13"
                      y2="8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
              <span
                style={{
                  fontSize: "0.85em",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: "rgba(255,255,255,0.80)",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                {pencilVisible ? "Edit media" : "Add media"}
              </span>
            </div>
          )}

          {/* ── Dropdown menu ────────────────────────────────────── */}
          {menuOpen && (
            <>
              {/* Transparent backdrop to close on outside click */}
              <div
                onClick={() => {
                  setMenuOpen(false);
                  setCaptureError("");
                }}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 98,
                  pointerEvents: "auto",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.5em)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 99,
                  pointerEvents: "auto",
                  width: "18em",
                  background: "rgba(14,15,20,0.97)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "1em",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  padding: "0.9em",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75em",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                {/* Section: Capture from URL */}
                <div>
                  <div
                    style={{
                      fontSize: "0.7em",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                      marginBottom: "0.6em",
                    }}
                  >
                    Capture from URL
                  </div>
                  <div
                    style={{
                      borderRadius: "0.65em",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5em",
                        padding: "0.55em 0.75em",
                      }}
                    >
                      <svg
                        width="0.85em"
                        height="0.85em"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ flexShrink: 0, opacity: 0.4 }}
                      >
                        <path
                          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <input
                        type="url"
                        value={menuUrl}
                        onChange={(e) => {
                          setMenuUrl(e.target.value);
                          setCaptureError("");
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleUrlCapture()
                        }
                        placeholder="https://example.com"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          background: "transparent",
                          fontSize: "0.85em",
                          outline: "none",
                          color: "rgba(255,255,255,0.85)",
                          border: "none",
                          minWidth: 0,
                        }}
                      />
                      {menuUrl && (
                        <button
                          onClick={() => {
                            setMenuUrl("");
                            setCaptureError("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            color: "rgba(255,255,255,0.35)",
                            display: "flex",
                          }}
                        >
                          <svg
                            width="0.8em"
                            height="0.8em"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <line
                              x1="18"
                              y1="6"
                              x2="6"
                              y2="18"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            <line
                              x1="6"
                              y1="6"
                              x2="18"
                              y2="18"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* Delay selector */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4em",
                        padding: "0.45em 0.7em",
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72em",
                          color: "rgba(255,255,255,0.38)",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        Wait
                      </span>
                      <div style={{ display: "flex", gap: 4, flex: 1 }}>
                        {[0, 1, 2, 3, 5, 8].map((s) => (
                          <button
                            key={s}
                            onClick={() => setCaptureDelay(s)}
                            style={{
                              flex: 1,
                              padding: "0.2em 0",
                              fontSize: "0.75em",
                              fontWeight: 700,
                              borderRadius: 5,
                              border: "none",
                              cursor: "pointer",
                              background:
                                captureDelay === s
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(255,255,255,0.06)",
                              color:
                                captureDelay === s
                                  ? "rgba(255,255,255,0.9)"
                                  : "rgba(255,255,255,0.35)",
                              outline:
                                captureDelay === s
                                  ? "1.5px solid rgba(255,255,255,0.5)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              transition: "all 0.1s",
                            }}
                          >
                            {s === 0 ? "0s" : `${s}s`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleUrlCapture}
                      disabled={capturing || !menuUrl.trim()}
                      style={{
                        width: "100%",
                        padding: "0.55em 0",
                        fontSize: "0.85em",
                        fontWeight: 600,
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                        background: menuUrl.trim()
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                        color: menuUrl.trim()
                          ? "rgba(255,255,255,0.75)"
                          : "rgba(255,255,255,0.25)",
                        border: "none",
                        cursor:
                          capturing || !menuUrl.trim()
                            ? "not-allowed"
                            : "pointer",
                        transition: "background 0.12s",
                      }}
                    >
                      {capturing
                        ? `⏳ ${captureDelay > 0 ? `Waiting ${captureDelay}s…` : "Capturing…"}`
                        : "📸 Capture Screenshot"}
                    </button>
                  </div>
                  {captureError && (
                    <p
                      style={{
                        fontSize: "0.75em",
                        color: "#ff453a",
                        margin: "0.4em 0 0",
                      }}
                    >
                      {captureError}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.08)",
                    margin: "0 -0.2em",
                  }}
                />

                {/* Section: Upload */}
                <div>
                  <div
                    style={{
                      fontSize: "0.7em",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                      marginBottom: "0.6em",
                    }}
                  >
                    Upload Media
                  </div>
                  <div style={{ display: "flex", gap: "0.5em" }}>
                    {/* Image */}
                    <button
                      onClick={() => imageFileRef.current?.click()}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4em",
                        padding: "0.6em 0",
                        borderRadius: "0.65em",
                        fontSize: "0.85em",
                        fontWeight: 600,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.80)",
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        width="0.9em"
                        height="0.9em"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                        <path
                          d="M21 15l-5-5L5 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Image
                    </button>
                    {/* Video */}
                    <button
                      onClick={() => videoFileRef.current?.click()}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4em",
                        padding: "0.6em 0",
                        borderRadius: "0.65em",
                        fontSize: "0.85em",
                        fontWeight: 600,
                        background: "rgba(48,209,88,0.10)",
                        border: "1px solid rgba(48,209,88,0.25)",
                        color: "rgba(48,209,88,0.90)",
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        width="0.9em"
                        height="0.9em"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M15 10l4.55-2.73A1 1 0 0 1 21 8.18v7.64a1 1 0 0 1-1.45.9L15 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <rect
                          x="3"
                          y="7"
                          width="12"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Video
                    </button>
                  </div>
                </div>

                {/* Clear (only when content loaded) */}
                {hasContent && (
                  <button
                    onClick={() => {
                      updateState({
                        screenshotUrl: null,
                        videoUrl: null,
                        contentType: null,
                      });
                      setMenuOpen(false);
                      onHidePencil();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.55em 0",
                      borderRadius: "0.65em",
                      fontSize: "0.85em",
                      fontWeight: 600,
                      background: "rgba(255,69,58,0.10)",
                      border: "1px solid rgba(255,69,58,0.25)",
                      color: "#ff453a",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Remove media
                  </button>
                )}
              </div>
            </>
          )}

          {/* Hidden file inputs */}
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                applyFile(f);
                onHidePencil();
              }
              e.target.value = "";
            }}
          />
          <input
            ref={videoFileRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                applyFile(f);
                onHidePencil();
              }
              e.target.value = "";
            }}
          />
        </div>
      </Html>
    </group>
  );

  // Large transparent mesh: clicking anywhere on screen reveals pencil
  // (only when content is loaded and pencil not yet shown)
  const screenClickMesh =
    hasContent && !pencilVisible ? (
      <mesh
        position={iconPos}
        onClick={(e) => {
          e.stopPropagation();
          onShowPencil();
        }}
      >
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
    ) : null;

  if (state.animation === "float") {
    return (
      <Float
        speed={1.4}
        rotationIntensity={0.06}
        floatIntensity={0.16}
        floatingRange={[-0.06, 0.06]}
      >
        {inner}
        {screenClickMesh}
        {overlay}
      </Float>
    );
  }

  if (state.animation === "spin") {
    return (
      <SpinWrapper>
        {inner}
        {screenClickMesh}
        {overlay}
      </SpinWrapper>
    );
  }

  if (state.animation === "pulse") {
    return (
      <PulseWrapper>
        {inner}
        {screenClickMesh}
        {overlay}
      </PulseWrapper>
    );
  }

  return (
    <>
      {inner}
      {screenClickMesh}
      {overlay}
    </>
  );
}

function SpinWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (ref.current) {
      ref.current.rotation.y = st.clock.elapsedTime * 0.4;
    }
  });
  return <group ref={ref}>{children}</group>;
}

function PulseWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (ref.current) {
      const s = 1 + Math.sin(st.clock.elapsedTime * 2) * 0.025;
      ref.current.scale.set(s, s, s);
    }
  });
  return <group ref={ref}>{children}</group>;
}

// ── Browser: screen content mesh (texture updated every frame) ────
function BrowserScreenContent({
  w,
  h,
  screenTexture,
  contentType,
}: {
  w: number;
  h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: "image" | "video" | null;
}) {
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#070b14", toneMapped: false }),
    [],
  );
  useEffect(
    () => () => {
      mat.dispose();
    },
    [mat],
  );
  const ctRef = useRef(contentType);
  ctRef.current = contentType;
  useFrame(() => {
    const tex = getGlobalScreenTexture();
    if (tex) {
      const needMap = mat.map !== tex;
      const needColor = mat.color.r < 0.99;
      if (needMap || needColor) {
        if (needMap) mat.map = tex;
        if (needColor) mat.color.set("#ffffff");
        mat.needsUpdate = true;
      }
      if (ctRef.current === "video") tex.needsUpdate = true;
    } else if (mat.map || mat.color.r > 0.04) {
      mat.map = null;
      mat.color.set("#070b14");
      mat.needsUpdate = true;
    }
  });
  return (
    <mesh material={mat} renderOrder={1}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

// ── Browser window — full 3D model with chrome UI + live screen ───
function BrowserFrame3D({
  screenTexture,
  contentType,
  browserMode,
}: {
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: "image" | "video" | null;
  browserMode: "dark" | "light";
}) {
  const isDark = browserMode !== "light";

  // Colours
  const frameColor = isDark ? "#1a1a1e" : "#ebebed";
  const barColor = isDark ? "#2c2c2e" : "#e2e2e4";
  const tabColor = isDark ? "#3a3a3c" : "#d0d0d2";
  const addrColor = isDark ? "#424244" : "#c8c8ca";
  const iconColor = isDark ? "#8e8e93" : "#7a7a80";
  const screenIdle = isDark ? "#070b14" : "#ffffff";

  // World dimensions (W×H browser window)
  const W = 3.4,
    H = 2.2,
    D = 0.07;
  const barH = 0.3; // chrome bar height
  const barY = H / 2 - barH / 2; // center of bar
  const contH = H - barH; // content area height
  const contY = barY - barH / 2 - contH / 2; // center of content

  // Tab strip occupies top 40% of bar, nav row the rest
  const tabH = barH * 0.4;
  const tabY = barY + (barH - tabH) / 2; // top of bar zone
  const navH = barH * 0.6;
  const navY = barY - tabH / 2; // nav zone center (negative offset)

  return (
    <group>
      {/* ── Frame body ─────────────────────────────────────────────── */}
      <RoundedBox
        args={[W, H, D]}
        radius={0.09}
        smoothness={6}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={frameColor}
          metalness={0.18}
          roughness={0.16}
          envMapIntensity={1.2}
          clearcoat={0.6}
          clearcoatRoughness={0.08}
        />
      </RoundedBox>

      {/* ── Chrome bar background ────────────────────────────────── */}
      <mesh position={[0, barY, D / 2 + 0.0005]}>
        <planeGeometry args={[W - 0.004, barH]} />
        <meshBasicMaterial color={barColor} />
      </mesh>

      {/* ── Divider line between bar and content ─────────────────── */}
      <mesh position={[0, barY - barH / 2 + 0.002, D / 2 + 0.001]}>
        <planeGeometry args={[W - 0.004, 0.005]} />
        <meshBasicMaterial color={isDark ? "#000000" : "#b0b0b2"} />
      </mesh>

      {/* ── Tab strip ────────────────────────────────────────────── */}
      {/* Active tab */}
      <mesh position={[-W / 2 + 0.5, tabY, D / 2 + 0.002]}>
        <planeGeometry args={[0.8, tabH - 0.02]} />
        <meshBasicMaterial color={barColor} />
      </mesh>
      {/* Tab label dots (simulated text) */}
      {[0, 0.08, 0.16].map((ox) => (
        <mesh key={ox} position={[-W / 2 + 0.26 + ox, tabY, D / 2 + 0.004]}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshBasicMaterial color={iconColor} />
        </mesh>
      ))}
      {/* Tab close × */}
      <mesh position={[-W / 2 + 0.84, tabY, D / 2 + 0.004]}>
        <circleGeometry args={[0.022, 16]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      {/* New-tab + button */}
      <mesh position={[-W / 2 + 0.98, tabY, D / 2 + 0.003]}>
        <planeGeometry args={[0.055, 0.055]} />
        <meshBasicMaterial color={tabColor} />
      </mesh>

      {/* ── Traffic lights ────────────────────────────────────────── */}
      {[
        { x: -W / 2 + 0.13, col: "#ff5f57" }, // close
        { x: -W / 2 + 0.21, col: "#febc2e" }, // minimize
        { x: -W / 2 + 0.29, col: "#28c840" }, // maximise
      ].map(({ x, col }) => (
        <mesh key={x} position={[x, navY, D / 2 + 0.003]}>
          <circleGeometry args={[0.026, 32]} />
          <meshBasicMaterial color={col} />
        </mesh>
      ))}

      {/* ── Back / Forward arrows ─────────────────────────────────── */}
      <mesh position={[-W / 2 + 0.43, navY, D / 2 + 0.003]}>
        <planeGeometry args={[0.042, 0.042]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      <mesh position={[-W / 2 + 0.51, navY, D / 2 + 0.003]}>
        <planeGeometry args={[0.042, 0.042]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>

      {/* ── Address bar pill ─────────────────────────────────────── */}
      <mesh position={[0.08, navY, D / 2 + 0.003]}>
        <planeGeometry args={[W * 0.62, navH * 0.52]} />
        <meshBasicMaterial color={addrColor} />
      </mesh>
      {/* Lock icon in address bar */}
      <mesh position={[-W * 0.31 + 0.12, navY, D / 2 + 0.005]}>
        <circleGeometry args={[0.016, 16]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      {/* URL dots */}
      {[-0.04, 0.04, 0.12, 0.2, 0.28, 0.36].map((ox) => (
        <mesh key={ox} position={[-W * 0.31 + 0.22 + ox, navY, D / 2 + 0.005]}>
          <planeGeometry args={[0.06, 0.028]} />
          <meshBasicMaterial color={isDark ? "#636368" : "#909096"} />
        </mesh>
      ))}

      {/* ── Bookmarks bar (thin strip just above content) ─────────── */}
      <mesh position={[0, barY - barH / 2 + 0.011, D / 2 + 0.001]}>
        <planeGeometry args={[W - 0.004, 0.022]} />
        <meshBasicMaterial color={isDark ? "#252527" : "#e8e8ea"} />
      </mesh>

      {/* ── Content screen ───────────────────────────────────────── */}
      <group position={[0, contY, D / 2 + 0.0008]}>
        {/* Background fill (idle colour) */}
        <mesh>
          <planeGeometry args={[W - 0.004, contH - 0.001]} />
          <meshBasicMaterial color={screenIdle} />
        </mesh>
        {/* Live image / video */}
        <BrowserScreenContent
          w={W - 0.004}
          h={contH - 0.001}
          screenTexture={screenTexture}
          contentType={contentType}
        />
      </group>

      {/* 3D Labels — part of the browser coordinate system */}
      <DeviceLabels
        sW={W - 0.004}
        sH={contH}
        sOffY={contY}
        zPos={D / 2 + 0.01}
        modelWidth={W}
      />
    </group>
  );
}

// ── Camera angle presets ──────────────────────────────────────────
const CAMERA_PRESETS: Record<string, { phi: number; theta: number }> = {
  hero: { phi: Math.PI / 2 - 0.12, theta: 0.28 },
  front: { phi: Math.PI / 2, theta: 0 },
  back: { phi: Math.PI / 2, theta: Math.PI },
  side: { phi: Math.PI / 2, theta: Math.PI / 2 },
  left: { phi: Math.PI / 2, theta: -Math.PI / 2 },
  top: { phi: 0.18, theta: 0 },
  bottom: { phi: Math.PI - 0.18, theta: 0 },
  "tilt-right": { phi: Math.PI / 2 - 0.08, theta: 0.72 },
  "tilt-left": { phi: Math.PI / 2 - 0.08, theta: -0.72 },
  low: { phi: Math.PI / 2 + 0.45, theta: 0.22 },
  diagonal: { phi: Math.PI / 2 - 0.18, theta: Math.PI / 4 },
  dramatic: { phi: Math.PI / 2 - 0.5, theta: 0.38 },
};

// ── Easing functions ──────────────────────────────────────────────
function applyEasing(alpha: number, easing?: string): number {
  switch (easing) {
    case "linear":
      return alpha;
    case "ease-in":
      return alpha * alpha * alpha;
    case "ease-out":
      return 1 - Math.pow(1 - alpha, 3);
    case "elastic": {
      if (alpha === 0 || alpha === 1) return alpha;
      return (
        Math.pow(2, -10 * alpha) *
          Math.sin((alpha * 10 - 0.75) * ((2 * Math.PI) / 3)) +
        1
      );
    }
    case "bounce": {
      const n1 = 7.5625,
        d1 = 2.75;
      let a = alpha;
      if (a < 1 / d1) return n1 * a * a;
      else if (a < 2 / d1) {
        a -= 1.5 / d1;
        return n1 * a * a + 0.75;
      } else if (a < 2.5 / d1) {
        a -= 2.25 / d1;
        return n1 * a * a + 0.9375;
      } else {
        a -= 2.625 / d1;
        return n1 * a * a + 0.984375;
      }
    }
    case "smooth":
    default:
      return alpha * alpha * (3 - 2 * alpha); // smoothstep
  }
}

function easeOutQuad(alpha: number) {
  return 1 - (1 - alpha) * (1 - alpha);
}

function easeInQuad(alpha: number) {
  return alpha * alpha;
}

function getPlaybackAlpha(
  alpha: number,
  easing: string | undefined,
  sameSceneAsPrev: boolean,
  sameSceneAsNext: boolean,
) {
  if (sameSceneAsPrev && sameSceneAsNext) return alpha;
  if (!sameSceneAsPrev && sameSceneAsNext) return easeOutQuad(alpha);
  if (sameSceneAsPrev && !sameSceneAsNext) return easeInQuad(alpha);
  return applyEasing(alpha, easing);
}

function catmullRomScalar(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
  tension: number,
) {
  const t2 = t * t;
  const t3 = t2 * t;
  const tangentScale = (1 - tension) * 0.5;
  const m1 = (p2 - p0) * tangentScale;
  const m2 = (p3 - p1) * tangentScale;
  // Hermite basis — guarantees h(0)=p1, h(1)=p2
  return (
    (2 * t3 - 3 * t2 + 1) * p1 +
    (t3 - 2 * t2 + t) * m1 +
    (-2 * t3 + 3 * t2) * p2 +
    (t3 - t2) * m2
  );
}

function catmullRomVector3(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  t: number,
  tension: number,
) {
  return new THREE.Vector3(
    catmullRomScalar(a.x, b.x, c.x, d.x, t, tension),
    catmullRomScalar(a.y, b.y, c.y, d.y, t, tension),
    catmullRomScalar(a.z, b.z, c.z, d.z, t, tension),
  );
}

// ── Spherical helpers (Rotato-style orbit interpolation) ──────────
function toSpherical(pos: THREE.Vector3, target: THREE.Vector3) {
  const offset = pos.clone().sub(target);
  const r = offset.length();
  if (r < 1e-10) return { r: 0, phi: Math.PI / 2, theta: 0 };
  const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / r)));
  const theta = Math.atan2(offset.x, offset.z);
  return { r, phi, theta };
}

function fromSpherical(
  r: number,
  phi: number,
  theta: number,
  target: THREE.Vector3,
) {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.cos(theta),
  ).add(target);
}

/** Unwrap angle so it stays within [-π, π] of the reference */
function unwrapAngle(angle: number, reference: number) {
  let diff = angle - reference;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return reference + diff;
}

// ── Interpolate between camera keyframes (spherical) ──────────────
function interpolateKeyframes(
  keyframes: CameraKeyframe[],
  t: number,
  curveTension: number,
): { position: THREE.Vector3; target: THREE.Vector3 } | null {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) {
    return {
      position: new THREE.Vector3(...keyframes[0].position),
      target: new THREE.Vector3(...keyframes[0].target),
    };
  }
  if (t <= keyframes[0].time) {
    return {
      position: new THREE.Vector3(...keyframes[0].position),
      target: new THREE.Vector3(...keyframes[0].target),
    };
  }
  if (t >= keyframes[keyframes.length - 1].time) {
    const last = keyframes[keyframes.length - 1];
    return {
      position: new THREE.Vector3(...last.position),
      target: new THREE.Vector3(...last.target),
    };
  }

  // Find segment [a, b] containing t
  let aIdx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      aIdx = i;
      break;
    }
  }
  const bIdx = aIdx + 1;
  const a = keyframes[aIdx];
  const b = keyframes[bIdx];

  const span = b.time - a.time;
  const rawAlpha = span > 0 ? (t - a.time) / span : 0;

  // Easing — within a scene use linear timing; between scenes apply easing
  const sameScene = !!a.sceneId && a.sceneId === b.sceneId;
  const prevKf = keyframes[Math.max(0, aIdx - 1)];
  const nextKf = keyframes[Math.min(keyframes.length - 1, bIdx + 1)];
  const sameSceneAsPrev = !!a.sceneId && a.sceneId === prevKf?.sceneId;
  const sameSceneAsNext = !!b.sceneId && b.sceneId === nextKf?.sceneId;
  const easedAlpha = sameScene
    ? rawAlpha
    : getPlaybackAlpha(rawAlpha, b.easing, sameSceneAsPrev, sameSceneAsNext);

  // Four Catmull-Rom control points
  const prevIdx = Math.max(0, aIdx - 1);
  const nextIdx = Math.min(keyframes.length - 1, bIdx + 1);
  const prev = keyframes[prevIdx];
  const next = keyframes[nextIdx];

  // Interpolate targets in Cartesian (targets are usually the same [0,0,0])
  const prevTarget = new THREE.Vector3(...prev.target);
  const aTarget = new THREE.Vector3(...a.target);
  const bTarget = new THREE.Vector3(...b.target);
  const nextTarget = new THREE.Vector3(...next.target);
  const target = catmullRomVector3(
    prevTarget,
    aTarget,
    bTarget,
    nextTarget,
    easedAlpha,
    curveTension,
  );

  // Convert positions to spherical coords relative to their own targets
  const s0 = toSpherical(new THREE.Vector3(...prev.position), prevTarget);
  const s1 = toSpherical(new THREE.Vector3(...a.position), aTarget);
  const s2 = toSpherical(new THREE.Vector3(...b.position), bTarget);
  const s3 = toSpherical(new THREE.Vector3(...next.position), nextTarget);

  // Unwrap theta for shortest-path orbit continuity
  s1.theta = unwrapAngle(s1.theta, s0.theta);
  s2.theta = unwrapAngle(s2.theta, s1.theta);
  s3.theta = unwrapAngle(s3.theta, s2.theta);

  // Catmull-Rom on spherical coordinates
  const r = catmullRomScalar(s0.r, s1.r, s2.r, s3.r, easedAlpha, curveTension);
  const phi = catmullRomScalar(
    s0.phi,
    s1.phi,
    s2.phi,
    s3.phi,
    easedAlpha,
    curveTension,
  );
  const theta = catmullRomScalar(
    s0.theta,
    s1.theta,
    s2.theta,
    s3.theta,
    easedAlpha,
    curveTension,
  );

  // Clamp radius and polar angle to valid ranges
  const position = fromSpherical(
    Math.max(0.1, r),
    Math.max(0.01, Math.min(Math.PI - 0.01, phi)),
    theta,
    target,
  );

  return { position, target };
}

// ── OrbitControls ────────────────────────────────────────────────
function HeroOrbitControls({
  deviceType,
  autoRotate,
  autoRotateSpeed,
  cameraAngle,
  cameraResetKey,
  moviePlaying,
  movieTimeRef,
  movieKeyframes,
  movieCurveTension,
  cameraStateRef,
  liftedControlsRef,
}: {
  deviceType: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
  cameraAngle: string;
  cameraResetKey: number;
  moviePlaying: boolean;
  movieTimeRef: React.MutableRefObject<number>;
  movieKeyframes: CameraKeyframe[];
  movieCurveTension: number;
  cameraStateRef: React.MutableRefObject<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>;
  liftedControlsRef?: React.MutableRefObject<any>;
}) {
  const { state, updateState } = useApp();
  const interactionMode = state.interactionMode;
  const zoomValue = state.zoomValue;
  const isLaptop = deviceType === "macbook";
  const controlsRef = useRef<any>(null);
  const zoomValueRef = useRef(zoomValue);
  const { camera } = useThree();
  const isFirstMount = useRef(true);
  const prevDeviceType = useRef(deviceType);
  const isInteractingRef = useRef(false);
  const animationStateRef = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
    active: boolean;
  }>({
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    active: false,
  });

  const zoomRange = useMemo(
    () => ({
      minDistance: isLaptop ? 3 : 2.2,
      maxDistance: isLaptop ? 18 : 15,
    }),
    [isLaptop],
  );

  const mouseButtons = useMemo(
    () => ({
      LEFT:
        interactionMode === "drag"
          ? THREE.MOUSE.PAN
          : interactionMode === "zoom"
            ? THREE.MOUSE.DOLLY
            : THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      // When in a specific tool, allow Rotate with Right Click so the user isn't locked out of any action
      RIGHT: interactionMode === "none" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
    }),
    [interactionMode],
  );

  const touches = useMemo(
    () => ({
      ONE:
        interactionMode === "drag"
          ? THREE.TOUCH.PAN
          : interactionMode === "zoom"
            ? THREE.TOUCH.ROTATE
            : THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }),
    [interactionMode],
  );

  useEffect(() => {
    zoomValueRef.current = zoomValue;
  }, [zoomValue]);

  const onZoomValueChangeInternal = useCallback(
    (val: number) => {
      updateState({ zoomValue: val }, true);
    },
    [updateState],
  );

  const applyPreset = useCallback(
    (angle: string, laptop: boolean) => {
      const controls = controlsRef.current;
      if (!controls) return;
      
      const preset = CAMERA_PRESETS[angle] ?? CAMERA_PRESETS.hero;
      const dist = laptop ? 6.2 : 5.6;
      const { phi, theta } = preset;
      
      const targetPos = new THREE.Vector3(
        dist * Math.sin(phi) * Math.sin(theta),
        dist * Math.cos(phi),
        dist * Math.sin(phi) * Math.cos(theta),
      );
      
      animationStateRef.current = {
        pos: targetPos,
        target: new THREE.Vector3(0, 0, 0),
        active: true,
      };
      
      return 0; // Return dummy raf ID
    },
    [],
  );

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || moviePlaying || isInteractingRef.current) return;

    const currentDirection = new THREE.Vector3().subVectors(
      camera.position,
      controls.target,
    );
    if (currentDirection.lengthSq() === 0) return;

    const targetDist = zoomValueToDistance(
      zoomValue,
      zoomRange.minDistance,
      zoomRange.maxDistance,
    );
    const currentDist = camera.position.distanceTo(controls.target);

    // Only apply if the difference is significant to avoid jitter
    if (Math.abs(targetDist - currentDist) > 0.01) {
      currentDirection.setLength(targetDist);
      camera.position.copy(controls.target).add(currentDirection);
      controls.update();
    }
  }, [
    camera,
    moviePlaying,
    zoomRange.maxDistance,
    zoomRange.minDistance,
    zoomValue,
  ]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const raf = applyPreset(cameraAngle, isLaptop);
    return () => cancelAnimationFrame(raf);
  }, [cameraResetKey, cameraAngle, isLaptop, applyPreset]);

  useEffect(() => {
    if (prevDeviceType.current === deviceType) return;
    prevDeviceType.current = deviceType;
    const raf = applyPreset("hero", deviceType === "macbook");
    return () => cancelAnimationFrame(raf);
  }, [deviceType, applyPreset]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (liftedControlsRef) liftedControlsRef.current = controls;

    if (moviePlaying && movieKeyframes.length >= 2 && !isInteractingRef.current) {
      const result = interpolateKeyframes(
        movieKeyframes,
        movieTimeRef.current,
        movieCurveTension,
      );
      if (result) {
        camera.position.copy(result.position);
        controls.target.copy(result.target);
      }
    } else if (animationStateRef.current.active && !isInteractingRef.current) {
      // Smoothly interpolate to preset view
      const target = animationStateRef.current;
      camera.position.lerp(target.pos, 0.08);
      controls.target.lerp(target.target, 0.08);
      controls.update();

      if (camera.position.distanceTo(target.pos) < 0.01 && controls.target.distanceTo(target.target) < 0.01) {
        target.active = false;
        camera.position.copy(target.pos);
        controls.target.copy(target.target);
        controls.update();
      }
    }

    cameraStateRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
    };

    const nextZoomValue = distanceToZoomValue(
      camera.position.distanceTo(controls.target),
      zoomRange.minDistance,
      zoomRange.maxDistance,
    );
    if (Math.abs(nextZoomValue - zoomValueRef.current) > 0.35) {
      zoomValueRef.current = nextZoomValue;
      updateState({ zoomValue: nextZoomValue }, true);
    }
  }, -2);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false} // Custom high-fidelity LensShift Pan used instead
      enableZoom={true}
      enableRotate={interactionMode !== "drag"}
      minDistance={zoomRange.minDistance}
      maxDistance={zoomRange.maxDistance}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.92}
      dampingFactor={0.05}
      enableDamping={true}
      rotateSpeed={0.7}
      panSpeed={0.9}
      zoomSpeed={0.75}
      mouseButtons={mouseButtons}
      touches={touches}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      onStart={() => {
        isInteractingRef.current = true;
      }}
      onEnd={() => {
        isInteractingRef.current = false;
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────
interface Device3DViewerProps {
  style?: React.CSSProperties;
  className?: string;
  movieTimeRef?: React.MutableRefObject<number>;
}

export const Device3DViewer = forwardRef<
  Device3DViewerHandle,
  Device3DViewerProps
>(function Device3DViewer(
  { style, className, movieTimeRef: externalMovieTimeRef },
  ref,
) {
  const { state, updateState } = useApp();
  const moviePlaying = state.movieMode;
  const isMobile = useIsMobile();
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const liftedControlsRef = useRef<any>(null);
  const cameraStateRef = useRef<{
    position: [number, number, number];
    target: [number, number, number];
  } | null>(null);
  const internalMovieTimeRef = useRef(0);
  const movieTimeRef = externalMovieTimeRef ?? internalMovieTimeRef;
  // Refs kept in sync with props/state for use inside renderAt (avoids stale closures)
  const moviePlayingRef = useRef(moviePlaying);
  const cameraKeyframesRef = useRef(state.cameraKeyframes);
  const [hintVisible, setHintVisible] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [pencilVisible, setPencilVisible] = useState(false);
  const interactionMode = state.interactionMode;
  const zoomValue = state.zoomValue;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Left click for Move tool, or Right click for any mode
    if (interactionMode === "drag" || e.button === 2) {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      // If right click, we may want to prevent the menu immediately, 
      // but usually contextmenu event is better.
    }
  };

  // Use a ref to track current pan values to avoid stale closures during high-frequency updates
  const panCacheRef = useRef({ x: state.canvasPanX ?? 0, y: state.canvasPanY ?? 0 });
  
  // Sync cache with state updates from other sources (like a reset)
  useEffect(() => {
    panCacheRef.current = { x: state.canvasPanX ?? 0, y: state.canvasPanY ?? 0 };
  }, [state.canvasPanX, state.canvasPanY]);

  const handlePointerMove = (e: React.PointerEvent) => {
    setHintVisible(false);
    
    // Check for either 'drag' mode with left click OR any mode with right click
    const isDragging = (interactionMode === "drag" && (e.buttons & 1)) || (e.buttons & 2);
    
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      
      const nextX = panCacheRef.current.x + dx;
      const nextY = panCacheRef.current.y + dy;
      
      panCacheRef.current = { x: nextX, y: nextY };
      
      updateState(
        {
          canvasPanX: nextX,
          canvasPanY: nextY,
        },
        true,
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };


  // ── Texture lives HERE — outside the Canvas so it never gets
  // disposed/reloaded when DeviceScene suspends or remounts. ──────
  const screenTexture = useScreenTexture(
    state.screenshotUrl,
    state.videoUrl,
    state.contentType,
  );

  // Keep refs in sync with latest reactive values so renderAt() always sees fresh data
  useEffect(() => {
    moviePlayingRef.current = moviePlaying;
  }, [moviePlaying]);
  useEffect(() => {
    cameraKeyframesRef.current = state.cameraKeyframes;
  }, [state.cameraKeyframes]);

  const handleThreeReady = useCallback(
    (gl: THREE.WebGLRenderer, cam: THREE.Camera, scene: THREE.Scene) => {
      glRef.current = gl;
      cameraRef.current = cam;
      sceneRef.current = scene;
    },
    [],
  );

  useImperativeHandle(ref, () => ({
    getGLElement: () => glRef.current?.domElement ?? null,
    getCameraState: () => cameraStateRef.current,
    renderAt: (time: number) => {
      const gl = glRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!gl || !scene || !camera) return;

      const keyframes = cameraKeyframesRef.current;
      if (moviePlayingRef.current && keyframes.length >= 2) {
        const result = interpolateKeyframes(
          keyframes,
          time,
          state.movieCurveTension ?? 0.45,
        );
        if (result) {
          camera.position.copy(result.position);
          // Point camera at the keyframe target so the view matrix is correct
          camera.lookAt(result.target);
          // Also update controls so OrbitControls stays consistent
          const controls = liftedControlsRef.current;
          if (controls) {
            controls.target.copy(result.target);
          }
        }
      }
      // Explicitly render so glEl contains exactly this frame before capture
      gl.render(scene, camera);
    },
  }));

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("video/")) {
        updateState({
          videoUrl: url,
          screenshotUrl: null,
          contentType: "video",
        });
      } else {
        updateState({
          screenshotUrl: url,
          videoUrl: null,
          contentType: "image",
        });
      }
    },
    [updateState],
  );

  const isLaptop = state.deviceType === "macbook";
  const hasContent = !!(state.screenshotUrl || state.videoUrl);
  const floatEnabled = state.animation === "float";

  // Hide pencil whenever the device model or content changes
  useEffect(() => {
    setPencilVisible(false);
  }, [state.deviceModel, state.deviceType]);
  useEffect(() => {
    if (!hasContent) setPencilVisible(false);
  }, [hasContent]);

  // Telephoto camera — narrow FOV like Rotato (feels more "product photo")
  // Camera positioned at hero angle: slightly right+up from center, looking left-down at device
  const fov = isLaptop ? 24 : 20;
  const camX = isLaptop ? 1.2 : 1.6; // Rightward → device appears from left (shows volume buttons)
  const camY = isLaptop ? 0.5 : 0.4; // Slightly above
  const camZ = isLaptop ? 6.2 : 5.6; // Depth

  const shadowFilter = useMemo(() => {
    const dir = state.contactShadowDirection || "atras";
    const opacity = (state.contactShadowOpacity ?? 65) / 100;
    if (opacity <= 0) return "none";

    // Values optimized for Rotato-style mockup look
    let dx = 0,
      dy = 0,
      blur = isLaptop ? 45 : 35;

    if (dir === "abajo") {
      dx = isLaptop ? 35 : 25;
      dy = isLaptop ? 50 : 35; // Strong diagonal
    } else if (dir === "derecha") {
      dx = isLaptop ? 60 : 45;
      dy = 0;
    } else if (dir === "izquierda") {
      dx = isLaptop ? -60 : -45;
      dy = 0;
    } else if (dir === "atras") {
      dx = 0;
      dy = 0;
      blur = isLaptop ? 60 : 50;
    }

    // We use a slight multiplier (0.6) for the opacity to keep it soft and realistic
    return `drop-shadow(${dx}px ${dy}px ${blur}px rgba(0,0,0,${opacity * 0.6}))`;
  }, [state.contactShadowDirection, state.contactShadowOpacity, isLaptop]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor:
          interactionMode === "drag"
            ? "move"
            : interactionMode === "zoom"
              ? "zoom-in"
              : "default",
        filter: shadowFilter,
        transition: "filter 0.3s ease",
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <R3FCanvas
        camera={{ position: [camX, camY, camZ], fov, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        shadows="soft"
        style={{ background: "transparent" }}
        dpr={[1, 2]}
        onPointerMissed={() => setPencilVisible(false)}
      >
        <SceneCapturer onReady={handleThreeReady} />

        {/* Reactively update renderer exposure from store */}
        <ExposureControl exposure={state.lightExposure} />

        {/* Studio lighting rig — adapts to env preset, brightness, ambient, warmth */}
        <StudioLights
          deviceType={state.deviceType}
          envPreset={state.envPreset}
          brightness={state.lightBrightness ?? 40}
          ambient={state.lightAmbient ?? 45}
          warmth={state.lightWarmth ?? 0}
        />

        {/* High-quality HDR environment map for photorealistic reflections.
              key={envPreset} forces a full remount so the new HDR actually loads.
              environmentIntensity driven by lightIBL slider (0-100 → 0-2×base). */}
        {state.envEnabled !== false && (
          <Suspense key={state.envPreset} fallback={null}>
            <Environment
              preset={
                state.envPreset as
                  | "studio"
                  | "warehouse"
                  | "sunset"
                  | "city"
                  | "forest"
                  | "night"
              }
              environmentIntensity={
                (ENV_INTENSITY[state.envPreset] ?? 1.4) *
                ((state.lightIBL ?? 40) / 50)
              }
              background={false}
            />
          </Suspense>
        )}

        {/* Device geometry — wrapped in scale group */}
        <group scale={state.deviceScale / 100}>
          {/* Floor reflection plane */}
          <FloorReflector isLaptop={isLaptop} />

          <Suspense fallback={<Loader />}>
            <DeviceScene
              floatEnabled={floatEnabled}
              pencilVisible={pencilVisible}
              onShowPencil={() => setPencilVisible(true)}
              onHidePencil={() => setPencilVisible(false)}
              screenTexture={screenTexture}
            />
          </Suspense>
        </group>

        {/* Clay mode — override all mesh materials to matte */}
        <ClayOverride
          enabled={state.clayMode ?? false}
          color={state.clayColor ?? "#e8ddd3"}
        />

        {/* High-fidelity Lens Shift for Composition Pan */}
        <LensShift px={state.canvasPanX ?? 0} py={state.canvasPanY ?? 0} />

        {/* Post-processing: bloom + DoF + SMAA */}
        <PostFX
          hasContent={hasContent}
          bloomIntensity={state.bloomIntensity ?? 22}
          dofEnabled={state.dofEnabled ?? false}
          dofFocusDistance={state.dofFocusDistance ?? 0.02}
          dofFocalLength={state.dofFocalLength ?? 0.05}
          dofBokehScale={state.dofBokehScale ?? 6}
        />

        {/* Controls with Rotato hero angle */}
        <HeroOrbitControls
          deviceType={state.deviceType}
          autoRotate={state.autoRotate}
          autoRotateSpeed={state.autoRotateSpeed}
          cameraAngle={state.cameraAngle}
          cameraResetKey={state.cameraResetKey}
          moviePlaying={moviePlaying}
          movieTimeRef={movieTimeRef}
          movieKeyframes={state.cameraKeyframes}
          movieCurveTension={state.movieCurveTension ?? 0.45}
          cameraStateRef={cameraStateRef}
          liftedControlsRef={liftedControlsRef}
        />
      </R3FCanvas>

      {/* High-fidelity Orientation Gizmo (Spline-style) */}
      <OrientationGimbal mainCamera={cameraRef.current} />

      <RotatoHint visible={hintVisible} />

      {/* ── Drag-and-drop visual feedback ────────────────────────── */}
      {dragOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
            border: "2px solid rgba(55,65,81,0.5)",
            borderRadius: 8,
            background: "rgba(55,65,81,0.05)",
            boxShadow: "inset 0 0 40px rgba(55,65,81,0.07)",
          }}
        />
      )}
    </div>
  );
});

/** 
 * High-fidelity 3D Orientation Gimbal
 * Rendered in a separate mini-canvas to stay on top and avoid main-scene camera offsets.
 */
function OrientationGimbal({ mainCamera }: { mainCamera: THREE.Camera | null }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        width: 64,
        height: 64,
        pointerEvents: "auto",
        zIndex: 100,
        cursor: "default",
      }}
    >
      <R3FCanvas
        camera={{ position: [0, 0, 5], fov: 26 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={2.5} />
        <pointLight position={[5, 5, 5]} intensity={2} />
        
        {/* Professional Spline-style circular background */}
        <mesh raycast={() => null}>
          <circleGeometry args={[1.5, 40]} />
          <meshBasicMaterial color="#ffffff" opacity={0.96} transparent />
        </mesh>
        {/* Soft outer border ring */}
        <mesh position={[0, 0, -0.05]} raycast={() => null}>
          <circleGeometry args={[1.54, 40]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
        {/* Depth shadow for the pill */}
        <mesh position={[0, 0, -0.1]} raycast={() => null}>
          <circleGeometry args={[1.58, 40]} />
          <meshBasicMaterial color="#000" opacity={0.03} transparent />
        </mesh>

        <GimbalContent mainCamera={mainCamera} />
      </R3FCanvas>
    </div>
  );
}

function GimbalContent({ mainCamera }: { mainCamera: THREE.Camera | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const { updateState } = useApp();

  useFrame(() => {
    if (groupRef.current && mainCamera) {
      // Sync gimbal orientation with main camera
      groupRef.current.quaternion.copy(mainCamera.quaternion).invert();
    }
  });

  const axisLength = 0.95;
  const axes = [
    { dir: new THREE.Vector3(1, 0, 0), color: "#ff5f5e", label: "X", angle: "side" },
    { dir: new THREE.Vector3(0, 1, 0), color: "#2dd4bf", label: "Y", angle: "top" },
    { dir: new THREE.Vector3(0, 0, 1), color: "#60a5fa", label: "Z", angle: "front" },
    { dir: new THREE.Vector3(-1, 0, 0), color: "#cbd5e1", label: "", angle: "left" },
    { dir: new THREE.Vector3(0, -1, 0), color: "#cbd5e1", label: "", angle: "bottom" },
    { dir: new THREE.Vector3(0, 0, -1), color: "#cbd5e1", label: "", angle: "back" },
  ];

  return (
    <group ref={groupRef}>
      {/* Central anchor point (Blue-Grey) */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.4} />
      </mesh>

      {axes.map((axis, i) => (
        <group key={i}>
          <mesh 
            position={axis.dir.clone().multiplyScalar(axisLength)}
            onClick={(e) => {
              e.stopPropagation();
              updateState({ cameraAngle: axis.angle as any });
            }}
            onPointerOver={(e) => {
               document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
               document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshStandardMaterial 
              color={axis.color} 
              emissive={axis.color} 
              emissiveIntensity={0.15} 
            />
          </mesh>
          <line raycast={() => null}>
            <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), axis.dir.clone().multiplyScalar(axisLength)])} />
            <lineBasicMaterial 
              attach="material" 
              color={i < 3 ? axis.color : "#cbd5e1"} 
              linewidth={1} 
              transparent 
              opacity={0.6} 
            />
          </line>
        </group>
      ))}
    </group>
  );
}
