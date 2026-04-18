import React, { useRef, useMemo, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useApp, CameraKeyframe } from "../../../store";

// ── Zoom logic constants/helpers ────────────────────────────────────
const ZOOM_SLIDER_MIN = 0;
const ZOOM_SLIDER_MAX = 100;

export function clampZoomSlider(value: number) {
  return Math.min(ZOOM_SLIDER_MAX, Math.max(ZOOM_SLIDER_MIN, value));
}

export function distanceToZoomValue(
  distance: number,
  minDistance: number,
  maxDistance: number,
) {
  const span = Math.max(0.0001, maxDistance - minDistance);
  const normalized = (distance - minDistance) / span;
  return clampZoomSlider((1 - normalized) * 100);
}

export function zoomValueToDistance(
  value: number,
  minDistance: number,
  maxDistance: number,
) {
  const zoomValue = clampZoomSlider(value);
  const normalized = 1 - zoomValue / 100;
  return minDistance + (maxDistance - minDistance) * normalized;
}

// ── Spline-style Camera Interpolation (Catmull-Rom + Distance Preservation) ───
interface InterpolationResult {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

/**
 * Smoothly interpolates between keyframes using Catmull-Rom splines.
 * To prevent the "accidental zoom" (dipping) often seen in Cartesian interpolation
 * during orbits, this separate the path into target position, direction, and distance.
 */
export function interpolateKeyframes(
  keyframes: CameraKeyframe[],
  time: number,
  curveTension: number = 0.45,
): InterpolationResult | null {
  if (keyframes.length === 0) return null;
  
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  if (time <= sorted[0].time) {
    return {
      position: new THREE.Vector3(...sorted[0].position),
      target: new THREE.Vector3(...sorted[0].target),
    };
  }
  if (time >= sorted[sorted.length - 1].time) {
    const last = sorted[sorted.length - 1];
    return {
      position: new THREE.Vector3(...last.position),
      target: new THREE.Vector3(...last.target),
    };
  }

  let i = 0;
  while (i < sorted.length - 1 && sorted[i + 1].time < time) i++;
  
  const k1 = sorted[i];
  const k2 = sorted[i + 1];
  const t = (time - k1.time) / (k2.time - k1.time);

  const ease = (v: number) => {
    const e = k2.easing || "smooth";
    switch (e) {
      case "linear": return v;
      case "ease-in": return v * v;
      case "ease-out": return v * (2 - v);
      case "expo-in-out": {
        if (v === 0 || v === 1) return v;
        return v < 0.5 ? 0.5 * Math.pow(2, 20 * v - 10) : -0.5 * Math.pow(2, -20 * v + 10) + 1;
      }
      case "back-out": {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2);
      }
      case "elastic": {
        const c4 = (2 * Math.PI) / 3;
        return v === 0 ? 0 : v === 1 ? 1 : Math.pow(2, -10 * v) * Math.sin((v * 10 - 0.75) * c4) + 1;
      }
      case "bounce": {
        const n1 = 7.5625, d1 = 2.75;
        let v2 = v;
        if (v2 < 1 / d1) return n1 * v2 * v2;
        else if (v2 < 2 / d1) return n1 * (v2 -= 1.5 / d1) * v2 + 0.75;
        else if (v2 < 2.5 / d1) return n1 * (v2 -= 2.25 / d1) * v2 + 0.9375;
        else return n1 * (v2 -= 2.625 / d1) * v2 + 0.984375;
      }
      case "bezier": {
        const pts = k2.bezierPoints || [0.42, 0, 0.58, 1];
        // Simple cubic bezier approximation
        const cx = 3.0 * pts[0];
        const bx = 3.0 * (pts[2] - pts[0]) - cx;
        const ax = 1.0 - cx - bx;
        const cy = 3.0 * pts[1];
        const by = 3.0 * (pts[3] - pts[1]) - cy;
        const ay = 1.0 - cy - by;
        
        let t = v;
        for (let i = 0; i < 5; i++) {
          const x = ((ax * t + bx) * t + cx) * t;
          const dx = (3.0 * ax * t + 2.0 * bx) * t + cx;
          if (Math.abs(x - v) < 0.001) break;
          t -= (x - v) / dx;
        }
        return ((ay * t + by) * t + cy) * t;
      }
      case "smooth":
      default: return v * v * (3 - 2 * v);
    }
  };

  const et = ease(t);

  const pos = new THREE.Vector3();
  const tar = new THREE.Vector3();

  // Helper for Catmull-Rom scalar interpolation
  const tension = 1 - curveTension;
  const interpolate = (p0: number, p1: number, p2: number, p3: number, alpha: number) => {
    const a2 = alpha * alpha, a3 = a2 * alpha;
    const f1 = -tension * a3 + 2 * tension * a2 - tension * alpha;
    const f2 = (2 - tension) * a3 + (tension - 3) * a2 + 1;
    const f3 = (tension - 2) * a3 + (3 - 2 * tension) * a2 + tension * alpha;
    const f4 = tension * a3 - tension * a2;
    return p0 * f1 + p1 * f2 + p2 * f3 + p3 * f4;
  };

  const getPoints = (idx: number, attr: 'position' | 'target') => {
    const p1 = sorted[idx][attr];
    const p2 = sorted[idx + 1][attr];
    const p0 = idx > 0 ? sorted[idx - 1][attr] : [p1[0] + (p1[0] - p2[0]), p1[1] + (p1[1] - p2[1]), p1[2] + (p1[2] - p2[2])];
    const p3 = idx < sorted.length - 2 ? sorted[idx + 2][attr] : [p2[0] + (p2[0] - p1[0]), p2[1] + (p2[1] - p1[1]), p2[2] + (p2[2] - p1[2])];
    return [p0, p1, p2, p3];
  };

  // 1. Interpolate Target Cartesianly
  const tPts = getPoints(i, 'target');
  tar.set(
    interpolate(tPts[0][0], tPts[1][0], tPts[2][0], tPts[3][0], et),
    interpolate(tPts[0][1], tPts[1][1], tPts[2][1], tPts[3][1], et),
    interpolate(tPts[0][2], tPts[1][2], tPts[2][2], tPts[3][2], et)
  );

  if (k2.easing === 'linear') {
    pos.lerpVectors(new THREE.Vector3(...k1.position), new THREE.Vector3(...k2.position), et);
    return { position: pos, target: tar };
  }

  // 2. Interpolate OFFSET VECTOR (Direction component)
  // This preserves the arc of the movement.
  const pPts = getPoints(i, 'position');
  const oPts = pPts.map((p, idx) => [p[0] - tPts[idx][0], p[1] - tPts[idx][1], p[2] - tPts[idx][2]]);
  const offX = interpolate(oPts[0][0], oPts[1][0], oPts[2][0], oPts[3][0], et);
  const offY = interpolate(oPts[0][1], oPts[1][1], oPts[2][1], oPts[3][1], et);
  const offZ = interpolate(oPts[0][2], oPts[1][2], oPts[2][2], oPts[3][2], et);

  // 3. Interpolate DISTANCE (Zoom component)
  // This ensures that if start and end distance is same, the camera doesn't "dip" in.
  const dists = oPts.map(o => Math.sqrt(o[0] * o[0] + o[1] * o[1] + o[2] * o[2]));
  const resDist = interpolate(dists[0], dists[1], dists[2], dists[3], et);

  // 4. Combine: Final Position = Target + Direction(normalized) * Distance
  const dir = new THREE.Vector3(offX, offY, offZ).normalize();
  pos.copy(tar).add(dir.multiplyScalar(resDist));

  return { position: pos, target: tar };
}





// ── Per-preset HDR environment intensity ───────────────────────────
// Kept in the 1.0–1.6 range: enough for realistic reflections without
// compounding with the direct lights to create overexposure.
export const ENV_INTENSITY: Record<string, number> = {
  studio: 1.0,
  warehouse: 1.12,
  city: 0.96,
  sunset: 1.04,
  forest: 0.9,
  night: 0.72,
};

interface HeroOrbitControlsProps {
  deviceType: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
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
}

export function HeroOrbitControls({
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
}: HeroOrbitControlsProps) {
  const { state, updateState } = useApp();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isInteractingRef = useRef(false);
  const zoomValue = state.zoomValue;
  const zoomValueRef = useRef(zoomValue);
  const isFirstMount = useRef(true);
  const interactionMode = state.interactionMode;

  const isLaptop = deviceType === "macbook";
  const zoomRange = useMemo(
    () => ({
      minDistance: isLaptop ? 1.5 : 0.8,
      maxDistance: isLaptop ? 14 : 10,
    }),
    [isLaptop],
  );

  const prevDeviceType = useRef(deviceType);

  const animationStateRef = useRef({
    active: false,
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });

  const applyPreset = useCallback(
    (angle: string, isLaptop: boolean) => {
      const pos = new THREE.Vector3();
      const tar = new THREE.Vector3();
      const dist = isLaptop ? 6.2 : 5.6;

      switch (angle) {
        case "front":
          pos.set(0, 0, dist);
          break;
        case "back":
          pos.set(0, 0, -dist);
          break;
        case "top":
          pos.set(0, dist, 0.01);
          break;
        case "bottom":
          pos.set(0, -dist, 0.01);
          break;
        case "left":
          pos.set(-dist, 0, 0);
          break;
        case "side":
          pos.set(dist, 0, 0);
          break;
        case "hero":
        default:
          pos.set(isLaptop ? 1.2 : 1.6, isLaptop ? 0.5 : 0.4, dist);
          break;
      }

      animationStateRef.current = { active: true, pos, target: tar };
      return 0;
    },
    [],
  );

  const mouseButtons = useMemo(
    () => ({
      LEFT: interactionMode === "none" ? THREE.MOUSE.ROTATE : -1,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    }),
    [interactionMode],
  );

  const touches = useMemo(
    () => ({
      ONE: interactionMode === "none" ? THREE.TOUCH.ROTATE : -1,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }),
    [interactionMode],
  );

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || moviePlaying || isInteractingRef.current) return;

    const currentDirection = camera.position.clone().sub(controls.target);
    const targetDist = zoomValueToDistance(
      zoomValue,
      zoomRange.minDistance,
      zoomRange.maxDistance,
    );
    const currentDist = camera.position.distanceTo(controls.target);

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
    applyPreset(cameraAngle, isLaptop);
  }, [cameraResetKey, cameraAngle, isLaptop, applyPreset]);

  useEffect(() => {
    if (prevDeviceType.current === deviceType) return;
    prevDeviceType.current = deviceType;
    applyPreset("hero", deviceType === "macbook");
  }, [deviceType, applyPreset]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (liftedControlsRef) liftedControlsRef.current = controls;

    if (
      moviePlaying &&
      movieKeyframes.length >= 2 &&
      !isInteractingRef.current
    ) {
      const result = interpolateKeyframes(
        movieKeyframes,
        movieTimeRef.current,
        movieCurveTension,
      );
      if (result) {
        // Rotato-style "Cinematic Weight" 
        // Instead of snapping, we lerp with a high coefficient to absorb tiny Recording/Spline jitters.
        // This gives the camera a sense of physical mass.
        if (movieTimeRef.current < 0.1) {
          // Snap at the very beginning of the clip to prevent a starting jump
          camera.position.copy(result.position);
          controls.target.copy(result.target);
        } else {
          camera.position.lerp(result.position, 0.4);
          controls.target.lerp(result.target, 0.4);
        }
      }
    } else if (animationStateRef.current.active && !isInteractingRef.current) {

      const target = animationStateRef.current;
      camera.position.lerp(target.pos, 0.08);
      controls.target.lerp(target.target, 0.08);
      controls.update();

      if (
        camera.position.distanceTo(target.pos) < 0.01 &&
        controls.target.distanceTo(target.target) < 0.01
      ) {
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
      enablePan={false}
      enableZoom={true}
      enableRotate={interactionMode !== "drag"}
      minDistance={zoomRange.minDistance}
      maxDistance={zoomRange.maxDistance}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
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
