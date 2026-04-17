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
import { Canvas as R3FCanvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
} from "@react-three/drei";
import * as THREE from "three";
import {
  useApp,
} from "../../store";
import { getModelById, DEVICE_MODELS } from "../../data/devices";
import { useIsMobile } from "../../hooks/use-mobile";
import { useScreenTexture } from "./useScreenTexture";
import { Phone3DModel } from "./Phone3DModel";
import { GLBDeviceModel } from "./GLBDeviceModel";
import { Tablet3DModel } from "./Tablet3DModel";
import { MacBook3DModel } from "./MacBook3DModel";
import { Watch3DModel } from "./Watch3DModel";

// Extracted sub-components from the viewer/ subdirectory
import { 
  Loader, 
  RotatoHint, 
  SceneCapturer, 
  ExposureControl, 
  LensShift,
  SpinWrapper,
  PulseWrapper
} from "./viewer/ViewerUtils";
import { StudioLights, ENV_LIGHTS } from "./viewer/ViewerLights";
import { PostFX } from "./viewer/ViewerPostFX";
import { FloorReflector, ClayOverride } from "./viewer/ViewerEffects";
import { ScreenDropZoneContent } from "./viewer/ViewerOverlay";
import { OrientationGimbal } from "./viewer/ViewerGimbal";
import { HeroOrbitControls, interpolateKeyframes, ENV_INTENSITY } from "./viewer/ViewerControls";

import { useGLTF, Html } from "@react-three/drei";

// Auto-preload every GLB model declared in devices.ts.
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
  /** Set the current playback time without necessarily rendering immediately. */
  setMovieTime: (time: number) => void;
}

export type InteractionMode = "none" | "drag" | "zoom";

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
  const [captureViewport, setCaptureViewport] = useState<"desktop" | "mobile">(
    () => (def.storeType === "iphone" || def.storeType === "watch" ? "mobile" : "desktop"),
  );

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

    // Compute target aspect ratio (matches the device screen) so the preview
    // maps 1:1 onto the mesh without extra letterboxing.
    const screenW = def.w - def.insetSide * 2;
    const screenH = def.h - def.insetTop - def.insetBottom;
    const physW = isLandscape ? screenH : screenW;
    const physH = isLandscape ? screenW : screenH;

    // Viewport width the remote browser uses to render the page.
    // Desktop = standard laptop width; Mobile = iPhone-class width so sites
    // serve their responsive layout instead of a shrunk desktop version.
    const viewportWidth = captureViewport === "mobile" ? 390 : 1280;
    // Output width for the captured image. thum.io's free tier caps around
    // 1600px; going higher returns an error instead of an image.
    const outputWidth = Math.min(1600, Math.round(viewportWidth * 1.25));
    const outputHeight = Math.max(
      400,
      Math.round(outputWidth * (physH / physW)),
    );

    let url = menuUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    // Build thum.io path segments. `noanimate` freezes CSS animations for a
    // clean shot, `viewportWidth` drives the responsive breakpoint, and
    // `delay` waits before capture. We intentionally keep the default JPEG
    // output (instead of `/png/`) because PNG requires a paid plan and would
    // otherwise return an error image, hiding the preview.
    const segments: string[] = [
      `width/${outputWidth}`,
      `crop/${outputHeight}`,
      `viewportWidth/${viewportWidth}`,
      "noanimate",
    ];
    if (captureDelay > 0) segments.push(`delay/${captureDelay * 1000}`);
    const thumUrl = `https://image.thum.io/get/${segments.join("/")}/${url}`;

    const closeDelay = captureDelay * 1000;
    setTimeout(() => {
      setMenuOpen(false);
      setMenuUrl("");
      setCapturing(false);
    }, closeDelay);

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

  const iconPos: [number, number, number] =
    state.deviceType === "macbook"
      ? [0, 0.28, 0.2]
      : state.deviceType === "watch"
        ? [0, 0, 0.06]
        : [0, 0, 0.1];

  const planeW =
    state.deviceType === "macbook"
      ? 2.2
      : state.deviceType === "ipad"
        ? 1.6
      : state.deviceType === "watch"
        ? 0.7
        : 0.85;
  const planeH =
    state.deviceType === "macbook"
      ? 1.4
      : state.deviceType === "ipad"
        ? 2.2
      : state.deviceType === "watch"
        ? 0.9
        : 1.65;

  const faceGroupRef = useRef<THREE.Group>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const _wn = useRef(new THREE.Vector3());
  const _wp = useRef(new THREE.Vector3());
  const _tc = useRef(new THREE.Vector3());
  const _q = useRef(new THREE.Quaternion());
  const _pjA = useRef(new THREE.Vector3());
  const _pjB = useRef(new THREE.Vector3());

  useFrame(({ camera, gl }: { camera: THREE.Camera; gl: THREE.WebGLRenderer }) => {
    if (!faceGroupRef.current || !wrapperRef.current) return;
    faceGroupRef.current.getWorldQuaternion(_q.current);
    faceGroupRef.current.getWorldPosition(_wp.current);
    _wn.current.set(0, 0, 1).applyQuaternion(_q.current);
    _tc.current.copy(camera.position).sub(_wp.current).normalize();
    const isFront = _wn.current.dot(_tc.current) > 0.05;
    wrapperRef.current.style.display = isFront ? "" : "none";

    _pjA.current.copy(_wp.current).project(camera);
    _pjB.current
      .set(_wp.current.x + 1, _wp.current.y, _wp.current.z)
      .project(camera);
    const pxPerUnit =
      Math.abs(_pjB.current.x - _pjA.current.x) *
      (gl.domElement.clientWidth / 2);
    const fs = Math.max(9, Math.min(16, pxPerUnit * 0.1));
    wrapperRef.current.style.fontSize = `${fs.toFixed(1)}px`;
  });

  const showIcon = !hasContent || pencilVisible;

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

    switch (state.deviceType) {
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

  const overlay = (
    <group ref={faceGroupRef} position={iconPos}>
      <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
        <div
          ref={wrapperRef}
          style={{
            pointerEvents: "none",
            position: "relative",
            display: "inline-block",
          }}
        >
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
                    <line x1="8" y1="3" x2="8" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="8" x2="13" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
              <span
                style={{
                  fontSize: "0.85em",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: "rgba(255,255,255,0.80)",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                {pencilVisible ? "Edit media" : "Add media"}
              </span>
            </div>
          )}

          {menuOpen && (
            <>
              <div
                onClick={() => {
                  setMenuOpen(false);
                  setCaptureError("");
                }}
                style={{ position: "fixed", inset: 0, zIndex: 98, pointerEvents: "auto" }}
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
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
              >
                <div>
                  <div style={{ fontSize: "0.7em", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.6em" }}>
                    Capture from URL
                  </div>
                  <div style={{ borderRadius: "0.65em", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5em", padding: "0.55em 0.75em" }}>
                      <svg width="0.85em" height="0.85em" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <input
                        type="url"
                        value={menuUrl}
                        onChange={(e) => { setMenuUrl(e.target.value); setCaptureError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleUrlCapture()}
                        placeholder="https://example.com"
                        onClick={(e) => e.stopPropagation()}
                        style={{ flex: 1, background: "transparent", fontSize: "0.85em", outline: "none", color: "rgba(255,255,255,0.85)", border: "none", minWidth: 0 }}
                      />
                    </div>
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
                        View
                      </span>
                      <div
                        role="radiogroup"
                        aria-label="Capture viewport"
                        style={{ display: "flex", gap: 4, flex: 1 }}
                      >
                        {(
                          [
                            { id: "desktop", label: "Desktop" },
                            { id: "mobile", label: "Mobile" },
                          ] as const
                        ).map((opt) => {
                          const active = captureViewport === opt.id;
                          return (
                            <button
                              key={opt.id}
                              role="radio"
                              aria-checked={active}
                              onClick={() => setCaptureViewport(opt.id)}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.35em",
                                padding: "0.28em 0",
                                fontSize: "0.75em",
                                fontWeight: 700,
                                borderRadius: 5,
                                border: "none",
                                cursor: "pointer",
                                background: active
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(255,255,255,0.06)",
                                color: active
                                  ? "rgba(255,255,255,0.9)"
                                  : "rgba(255,255,255,0.45)",
                                outline: active
                                  ? "1.5px solid rgba(255,255,255,0.5)"
                                  : "1px solid rgba(255,255,255,0.1)",
                                transition: "all 0.1s",
                              }}
                            >
                              {opt.id === "desktop" ? (
                                <svg
                                  width="0.85em"
                                  height="0.85em"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="2"
                                    y="4"
                                    width="20"
                                    height="13"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  />
                                  <path
                                    d="M8 21h8M12 17v4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="0.85em"
                                  height="0.85em"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <rect
                                    x="6"
                                    y="2"
                                    width="12"
                                    height="20"
                                    rx="2.5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  />
                                  <path
                                    d="M11 18h2"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              )}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
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
                        title="Wait before taking the screenshot. Useful for sites with animations, splash screens, or lazy-loaded content."
                      >
                        Wait
                      </span>
                      <div
                        role="radiogroup"
                        aria-label="Capture delay"
                        style={{ display: "flex", gap: 4, flex: 1 }}
                      >
                        {[0, 1, 2, 3, 5, 8].map((s) => {
                          const active = captureDelay === s;
                          return (
                            <button
                              key={s}
                              role="radio"
                              aria-checked={active}
                              onClick={() => setCaptureDelay(s)}
                              style={{
                                flex: 1,
                                padding: "0.2em 0",
                                fontSize: "0.75em",
                                fontWeight: 700,
                                borderRadius: 5,
                                border: "none",
                                cursor: "pointer",
                                background: active
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(255,255,255,0.06)",
                                color: active
                                  ? "rgba(255,255,255,0.9)"
                                  : "rgba(255,255,255,0.35)",
                                outline: active
                                  ? "1.5px solid rgba(255,255,255,0.5)"
                                  : "1px solid rgba(255,255,255,0.1)",
                                transition: "all 0.1s",
                              }}
                            >
                              {s === 0 ? "0s" : `${s}s`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={handleUrlCapture}
                      disabled={capturing || !menuUrl.trim()}
                      style={{ width: "100%", padding: "0.55em 0", fontSize: "0.85em", fontWeight: 600, borderTop: "1px solid rgba(255,255,255,0.07)", background: menuUrl.trim() ? "rgba(255,255,255,0.08)" : "transparent", color: menuUrl.trim() ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)", border: "none", cursor: capturing || !menuUrl.trim() ? "not-allowed" : "pointer", transition: "background 0.12s" }}
                    >
                      {capturing ? `⏳ ${captureDelay > 0 ? `Waiting ${captureDelay}s…` : "Capturing…"}` : "📸 Capture Screenshot"}
                    </button>
                  </div>
                  {captureError && <p style={{ fontSize: "0.75em", color: "#ff453a", margin: "0.4em 0 0" }}>{captureError}</p>}
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 -0.2em" }} />
                <div>
                  <div style={{ fontSize: "0.7em", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.6em" }}>Upload Media</div>
                  <div style={{ display: "flex", gap: "0.5em" }}>
                    <button onClick={() => imageFileRef.current?.click()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4em", padding: "0.6em 0", borderRadius: "0.65em", fontSize: "0.85em", fontWeight: 600, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.80)", cursor: "pointer" }}>
                      <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Image
                    </button>
                    <button onClick={() => videoFileRef.current?.click()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4em", padding: "0.6em 0", borderRadius: "0.65em", fontSize: "0.85em", fontWeight: 600, background: "rgba(48,209,88,0.10)", border: "1px solid rgba(48,209,88,0.25)", color: "rgba(48,209,88,0.90)", cursor: "pointer" }}>
                      <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.55-2.73A1 1 0 0 1 21 8.18v7.64a1 1 0 0 1-1.45.9L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="7" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2" /></svg>
                      Video
                    </button>
                  </div>
                </div>
                {hasContent && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4em",
                        padding: "0.45em 0.7em",
                        borderRadius: "0.6em",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
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
                        title="How the media adapts to the device screen. Auto-rotates portrait/landscape mismatches."
                      >
                        Fit
                      </span>
                      <div
                        role="radiogroup"
                        aria-label="Screen fit mode"
                        style={{ display: "flex", gap: 4, flex: 1 }}
                      >
                        {(
                          [
                            {
                              id: "cover",
                              label: "Cover",
                              title:
                                "Fills the screen without distortion. Crops edges if needed.",
                              icon: (
                                <svg
                                  width="0.85em"
                                  height="0.85em"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
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
                                  <rect
                                    x="6"
                                    y="6"
                                    width="12"
                                    height="12"
                                    fill="currentColor"
                                    opacity="0.35"
                                  />
                                </svg>
                              ),
                            },
                            {
                              id: "contain",
                              label: "Contain",
                              title:
                                "Shows the entire media. Adds letterbox bars if aspect ratios differ.",
                              icon: (
                                <svg
                                  width="0.85em"
                                  height="0.85em"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
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
                                  <rect
                                    x="3"
                                    y="8"
                                    width="18"
                                    height="8"
                                    fill="currentColor"
                                    opacity="0.35"
                                  />
                                </svg>
                              ),
                            },
                            {
                              id: "fill",
                              label: "Fill",
                              title:
                                "Stretches the media to fill the screen. May distort the aspect ratio.",
                              icon: (
                                <svg
                                  width="0.85em"
                                  height="0.85em"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
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
                                  <path
                                    d="M7 12h10M7 12l2-2M7 12l2 2M17 12l-2-2M17 12l-2 2"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ),
                            },
                          ] as const
                        ).map((opt) => {
                          const active = state.screenFit === opt.id;
                          return (
                            <button
                              key={opt.id}
                              role="radio"
                              aria-checked={active}
                              title={opt.title}
                              onClick={() => updateState({ screenFit: opt.id })}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.3em",
                                padding: "0.28em 0",
                                fontSize: "0.72em",
                                fontWeight: 700,
                                borderRadius: 5,
                                border: "none",
                                cursor: "pointer",
                                background: active
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(255,255,255,0.06)",
                                color: active
                                  ? "rgba(255,255,255,0.9)"
                                  : "rgba(255,255,255,0.45)",
                                outline: active
                                  ? "1.5px solid rgba(255,255,255,0.5)"
                                  : "1px solid rgba(255,255,255,0.1)",
                                transition: "all 0.1s",
                              }}
                            >
                              {opt.icon}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button onClick={() => { updateState({ screenshotUrl: null, videoUrl: null, contentType: null }); setMenuOpen(false); onHidePencil(); }} style={{ width: "100%", padding: "0.55em 0", borderRadius: "0.65em", fontSize: "0.85em", fontWeight: 600, background: "rgba(255,69,58,0.10)", border: "1px solid rgba(255,69,58,0.25)", color: "#ff453a", cursor: "pointer" }}>✕ Remove media</button>
                  </>
                )}
              </div>
            </>
          )}

          <input ref={imageFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { applyFile(f); onHidePencil(); } e.target.value = ""; }} />
          <input ref={videoFileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { applyFile(f); onHidePencil(); } e.target.value = ""; }} />
        </div>
      </Html>
    </group>
  );

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
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.FrontSide} />
      </mesh>
    ) : null;

  if (state.animation === "float") {
    return (
      <Float speed={1.4} rotationIntensity={0.06} floatIntensity={0.16} floatingRange={[-0.06, 0.06]}>
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

// ── Main component ────────────────────────────────────────────────
interface Device3DViewerProps {
  style?: React.CSSProperties;
  className?: string;
  movieTimeRef?: React.MutableRefObject<number>;
  moviePlaying?: boolean;
}

export const Device3DViewer = forwardRef<
  Device3DViewerHandle,
  Device3DViewerProps
>(function Device3DViewer(
  { style, className, movieTimeRef: externalMovieTimeRef, moviePlaying = false },
  ref,
) {
  const { state, updateState } = useApp();
  // moviePlaying is now passed as a prop from App -> Canvas -> here
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
  const moviePlayingRef = useRef(moviePlaying);
  const cameraKeyframesRef = useRef(state.cameraKeyframes);
  const [hintVisible, setHintVisible] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [pencilVisible, setPencilVisible] = useState(false);
  const interactionMode = state.interactionMode;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (interactionMode === "drag" || e.button === 2) {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const panCacheRef = useRef({ x: state.canvasPanX ?? 0, y: state.canvasPanY ?? 0 });
  
  useEffect(() => {
    panCacheRef.current = { x: state.canvasPanX ?? 0, y: state.canvasPanY ?? 0 };
  }, [state.canvasPanX, state.canvasPanY]);

  const handlePointerMove = (e: React.PointerEvent) => {
    setHintVisible(false);
    const isDragging = (interactionMode === "drag" && (e.buttons & 1)) || (e.buttons & 2);
    
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      
      const nextX = panCacheRef.current.x + dx;
      const nextY = panCacheRef.current.y + dy;
      
      panCacheRef.current = { x: nextX, y: nextY };
      
      updateState({ canvasPanX: nextX, canvasPanY: nextY }, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Device screen aspect (width / height), flipped when the device is in
  // landscape. Used by the texture hook to fit the media responsively.
  const screenAspectForTexture = (() => {
    const sw = def.w - def.insetSide * 2;
    const sh = def.h - def.insetTop - def.insetBottom;
    return isLandscape ? sh / sw : sw / sh;
  })();

  const screenTexture = useScreenTexture(
    state.screenshotUrl,
    state.videoUrl,
    state.contentType,
    screenAspectForTexture,
    state.screenFit,
  );

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
          camera.lookAt(result.target);
          const controls = liftedControlsRef.current;
          if (controls) {
            controls.target.copy(result.target);
          }
        }
      }
      gl.render(scene, camera);
    },
    setMovieTime: (time: number) => {
      movieTimeRef.current = time;
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
        updateState({ videoUrl: url, screenshotUrl: null, contentType: "video" });
      } else {
        updateState({ screenshotUrl: url, videoUrl: null, contentType: "image" });
      }
    },
    [updateState],
  );

  const isLaptop = state.deviceType === "macbook";
  const hasContent = !!(state.screenshotUrl || state.videoUrl);
  const floatEnabled = state.animation === "float";

  useEffect(() => {
    setPencilVisible(false);
  }, [state.deviceModel, state.deviceType]);
  useEffect(() => {
    if (!hasContent) setPencilVisible(false);
  }, [hasContent]);

  const fov = isLaptop ? 24 : 20;
  const camX = isLaptop ? 1.2 : 1.6;
  const camY = isLaptop ? 0.5 : 0.4;
  const camZ = isLaptop ? 6.2 : 5.6;

  const shadowFilter = useMemo(() => {
    const dir = state.contactShadowDirection || "atras";
    const opacity = (state.contactShadowOpacity ?? 65) / 100;
    if (opacity <= 0) return "none";

    let dx = 0, dy = 0, blur = isLaptop ? 45 : 35;
    if (dir === "abajo") { dx = isLaptop ? 35 : 25; dy = isLaptop ? 50 : 35; }
    else if (dir === "derecha") { dx = isLaptop ? 60 : 45; dy = 0; }
    else if (dir === "izquierda") { dx = isLaptop ? -60 : -45; dy = 0; }
    else if (dir === "atras") { dx = 0; dy = 0; blur = isLaptop ? 60 : 50; }

    return `drop-shadow(${dx}px ${dy}px ${blur}px rgba(0,0,0,${opacity * 0.6}))`;
  }, [state.contactShadowDirection, state.contactShadowOpacity, isLaptop]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: interactionMode === "drag" ? "move" : interactionMode === "zoom" ? "zoom-in" : "default",
        filter: shadowFilter,
        transition: "filter 0.3s ease",
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
        shadows
        style={{ background: "transparent" }}
        dpr={[1, 2]}
        onPointerMissed={() => setPencilVisible(false)}
      >
        <SceneCapturer onReady={handleThreeReady} />
        <ExposureControl exposure={state.lightExposure} />
        <StudioLights
          deviceType={state.deviceType}
          envPreset={state.envPreset}
          brightness={state.lightBrightness ?? 40}
          ambient={state.lightAmbient ?? 45}
          warmth={state.lightWarmth ?? 0}
        />
        {state.envEnabled !== false && (
          <Suspense key={state.envPreset} fallback={null}>
            <Environment
              preset={state.envPreset as any}
              environmentIntensity={(ENV_INTENSITY[state.envPreset] ?? 1.4) * ((state.lightIBL ?? 40) / 50)}
              background={false}
            />
          </Suspense>
        )}
        <group scale={state.deviceScale / 100}>
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
        <ClayOverride enabled={state.clayMode ?? false} color={state.clayColor ?? "#e8ddd3"} />
        <LensShift px={state.canvasPanX ?? 0} py={state.canvasPanY ?? 0} />
        <PostFX
          hasContent={hasContent}
          bloomIntensity={state.bloomIntensity ?? 22}
          dofEnabled={state.dofEnabled ?? false}
          dofFocusDistance={state.dofFocusDistance ?? 0.02}
          dofFocalLength={state.dofFocalLength ?? 0.05}
          dofBokehScale={state.dofBokehScale ?? 6}
        />
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
      <OrientationGimbal mainCamera={cameraRef.current} />
      <RotatoHint visible={hintVisible} />
      {dragOver && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", border: "2px solid rgba(55,65,81,0.5)", borderRadius: 8, background: "rgba(55,65,81,0.05)", boxShadow: "inset 0 0 40px rgba(55,65,81,0.07)" }} />
      )}
    </div>
  );
});
