/**
 * GLBDeviceModel — universal loader for any GLB phone model.
 *
 * Handles two export conventions automatically:
 *   Y-up (glTF spec): no extra rotation  →  iPhone 16, 17 Pro, 14 Pro
 *   Z-up (3ds Max):   rotate -90° on X   →  iPhone 13 Pro
 *
 * Screen detection strategy:
 *   1. Named material: "display" or "screen" → highest priority
 *   2. Geometric: flattest large mesh at the front face (for hash-named models)
 *   3. Baked single-mesh fallback: use def.w/h proportions for overlay sizing
 *
 * Screen content is shown via an overlay plane placed just in front of the screen
 * face. `depthWrite: true` ensures back-face camera modules are always occluded.
 */

import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

// ── Geometry helpers ──────────────────────────────────────────────────

/** Parse a CSS border-radius string (rem or px) to pixels (assumes 16px/rem). */
function parseScreenBrPx(br: string): number {
  const m = br.match(/^([\d.]+)(rem|px)?$/);
  if (!m) return 0;
  const v = parseFloat(m[1]);
  return m[2] === 'rem' ? v * 16 : v;
}

/**
 * Build a ShapeGeometry for a rounded rectangle and remap UVs so that a
 * texture fills the entire shape (U=0..1 maps to X=-w/2..w/2, etc.).
 */
function makeRoundedRectGeom(w: number, h: number, r: number): THREE.ShapeGeometry {
  const safeR = Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001);
  const shape = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  shape.moveTo(-hw + safeR, -hh);
  shape.lineTo( hw - safeR, -hh);
  shape.quadraticCurveTo( hw, -hh,  hw, -hh + safeR);
  shape.lineTo( hw,  hh - safeR);
  shape.quadraticCurveTo( hw,  hh,  hw - safeR,  hh);
  shape.lineTo(-hw + safeR,  hh);
  shape.quadraticCurveTo(-hw,  hh, -hw,  hh - safeR);
  shape.lineTo(-hw, -hh + safeR);
  shape.quadraticCurveTo(-hw, -hh, -hw + safeR, -hh);

  const geom = new THREE.ShapeGeometry(shape, 8);

  // ShapeGeometry uses shape-space UVs; remap to [0,1] across the rectangle.
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const uv  = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2]     = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geom;
}

const TARGET_H = 2.5;

// ── Types ────────────────────────────────────────────────────────────

interface ScreenOverlayDims {
  sW: number;
  sH: number;
  sOffY: number;
}

interface ModelTransform {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  screenFaceZ: number;
  screenFacesNeg: boolean;
  /** Model body width in Three.js units (after scaling) */
  modelWidth: number;
  /** True when the scene has multi-part meshes (not a single baked mesh) */
  isMultiMesh: boolean;
  /** Overlay dims derived from detected screen mesh (null for baked models) */
  detectedScreen: ScreenOverlayDims | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Get a single lowercase string from a mesh's name + material names */
function meshKey(obj: THREE.Mesh): string {
  const parts = [obj.name];
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  mats.forEach(m => { if (m?.name) parts.push(m.name); });
  return parts.join(' ').toLowerCase();
}

/**
 * Detect the screen mesh inside `root` (in LOCAL/scene space, before our group transform).
 * Returns the world bounding box of the best candidate, or null.
 *
 * Priority:
 *   1. Mesh whose name or material includes "display" or "screen" (case-insensitive)
 *   2. Flattest + largest-area mesh at the front face (frontZ side)
 *
 * For Z-up models we skip geometric detection — the single-mesh baked model handles it via overlay.
 */
function detectScreenMesh(
  root: THREE.Object3D,
  isZUp: boolean,
  frontZ: number,    // max Z of the whole scene (local coords, Y-up)
  centerZ: number,   // center Z of the whole scene
): THREE.Box3 | null {
  if (isZUp) return null; // Z-up models: use fallback overlay only

  let namedBbox: THREE.Box3 | null = null;
  let bestGeoBbox: THREE.Box3 | null = null;
  let bestGeoScore = -Infinity;

  const localBox = new THREE.Box3();
  const localSize = new THREE.Vector3();
  const localCenter = new THREE.Vector3();

  root.traverse((obj: THREE.Object3D) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const geo = obj.geometry;
    if (!geo?.attributes?.position) return;

    localBox.setFromObject(obj);
    localBox.getSize(localSize);
    localBox.getCenter(localCenter);

    const key = meshKey(obj);

    // Priority 1: explicit name match
    if ((key.includes('display') || (key.includes('screen') && !key.includes('screen2')))
      && namedBbox === null) {
      namedBbox = localBox.clone();
      return;
    }

    // Priority 2: geometric — flattest mesh at front face, large area
    const midFront = 0.5 * (frontZ + centerZ); // midpoint between center and front
    const isFront = localCenter.z > midFront;
    if (!isFront) return;

    const thinness = 1 / (localSize.z + 1e-6); // flatter = higher score
    const area = localSize.x * localSize.y;
    const score = thinness * area;

    if (score > bestGeoScore) {
      bestGeoScore = score;
      bestGeoBbox = localBox.clone();
    }
  });

  return namedBbox ?? bestGeoBbox;
}

// ── Transform computation ─────────────────────────────────────────────

function computeTransform(sceneObj: THREE.Object3D, def: DeviceModelDef): ModelTransform {
  // Force world-matrix update so setFromObject gives correct bounds even for
  // detached scenes (not yet added to the Three.js renderer scene graph).
  sceneObj.updateMatrixWorld(true);

  const box    = new THREE.Box3().setFromObject(sceneObj);
  const size   = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const meshCount = countMeshes(sceneObj);
  const isMultiMesh = meshCount > 1;

  // Identify Z-up vs Y-up (auto-detect only; manual glbRotateX overrides this path).
  const glbRotX = def.glbRotateX ?? 0;
  const isZUp   = glbRotX === 0 && size.z > size.y * 1.4 && size.z > size.x * 1.4;

  if (isZUp) {
    const s = TARGET_H / size.z;
    const rotation: [number,number,number] = [-Math.PI / 2, 0, 0];
    const position: [number,number,number] = [
      -center.x * s,
      -center.z * s,
       center.y * s,
    ];
    // Screen face: +Y in 3ds Max → -Z after rotation
    const screenFaceZ = -(box.max.y - center.y) * s;
    return {
      scale: s, position, rotation,
      screenFaceZ, screenFacesNeg: true,
      modelWidth: size.x * s,
      isMultiMesh,
      detectedScreen: null,
    };
  }

  // Y-up standard glTF — with optional Z-rotation and/or X-rotation.
  //
  // glbRotateZ: corrects landscape-exported models (phone on its side).
  // glbRotateX: corrects models where screen doesn't face +Z camera
  //             (e.g. Apple Watch: local Y is depth, screen faces local +Z which
  //              maps to world -Y → needs -90° X rotation so screen faces +Z).
  // screenFacesBack: screen exported at -Z; we flip 180° around Y.
  const glbRotZ = def.glbRotateZ ?? 0;
  const cosZ = Math.cos(glbRotZ);
  const sinZ = Math.sin(glbRotZ);
  const cosX = Math.cos(glbRotX);
  const sinX = Math.sin(glbRotX);

  // ── Step 1: Z rotation (swaps XY extents for landscape exports) ──────
  const effW_z = Math.abs(size.x * cosZ) + Math.abs(size.y * sinZ);
  const effH_z = Math.abs(size.x * sinZ) + Math.abs(size.y * cosZ);
  const eCX    = center.x * cosZ - center.y * sinZ;
  const eCY_z  = center.x * sinZ + center.y * cosZ;

  // ── Step 2: X rotation (swaps YZ extents, e.g. Apple Watch) ─────────
  // After X rotation: new Y = eCY_z*cosX - center.z*sinX
  //                   new Z = eCY_z*sinX + center.z*cosX
  const effH   = Math.abs(effH_z * cosX) + Math.abs(size.z * sinX);
  const eCY    = eCY_z * cosX - center.z * sinX;
  const eCZ    = eCY_z * sinX + center.z * cosX;

  // Scale so the effective height fills TARGET_H.
  const s = TARGET_H / effH;

  const facesBack = !!def.screenFacesBack;
  const rotation: [number, number, number] = [glbRotX, facesBack ? Math.PI : 0, glbRotZ];

  // Center the model at world origin (accounting for all rotations).
  const position: [number, number, number] = [
    -(facesBack ? -eCX : eCX) * s,
    -eCY * s,
    facesBack ? eCZ * s : -eCZ * s,
  ];

  // ── Coarse screen-face Z from bounding box ───────────────────────────
  // After X rotation the front-face Z comes from a combination of Y and Z offsets.
  // For glbRotX=0 this reduces to (box.max.z - center.z)*s (standard).
  const boxFaceY = facesBack ? box.min.y : box.max.y;
  const boxFaceZ = facesBack ? box.min.z : box.max.z;
  let screenFaceZ = Math.abs(
    (boxFaceY - center.y) * sinX + (boxFaceZ - center.z) * cosX
  ) * s;

  // ── Screen mesh detection ──────────────────────────────────────────
  let detectedScreen: ScreenOverlayDims | null = null;
  const screenBbox = detectScreenMesh(sceneObj, false, box.max.z, center.z);
  if (screenBbox) {
    const sc = new THREE.Vector3();
    const ss = new THREE.Vector3();
    screenBbox.getCenter(sc);
    screenBbox.getSize(ss);

    // Transform screen center through Z then X rotation to find its world Z.
    const sc_y_z = sc.x * sinZ + sc.y * cosZ;
    const sc_z_z = sc.z;

    const measuredFaceZ = Math.abs(
      (sc_y_z - eCY_z) * sinX + (sc_z_z - center.z) * cosX
    ) * s;

    if (measuredFaceZ > 0.001) {
      // For pure-Z models (no X rotation), only use detected face if closer than bbox face.
      if (glbRotX !== 0 || measuredFaceZ < screenFaceZ) {
        screenFaceZ = measuredFaceZ;
      }
    }

    // Screen extents after Z then X rotation:
    const ss_x_z  = Math.abs(ss.x * cosZ) + Math.abs(ss.y * sinZ);
    const ss_y_z  = Math.abs(ss.x * sinZ) + Math.abs(ss.y * cosZ);
    const ss_y_x  = Math.abs(ss_y_z * cosX) + Math.abs(ss.z * sinX);

    // Screen center Y in the final rotated frame:
    const sc_y_x  = sc_y_z * cosX - sc_z_z * sinX;

    detectedScreen = {
      sW:    ss_x_z * s,
      sH:    ss_y_x * s,
      sOffY: (sc_y_x - eCY) * s,
    };
  }

  return {
    scale: s, position, rotation,
    screenFaceZ, screenFacesNeg: false,
    modelWidth: effW_z * s,
    isMultiMesh,
    detectedScreen,
  };
}

function countMeshes(root: THREE.Object3D): number {
  let n = 0;
  root.traverse(o => { if (o instanceof THREE.Mesh) n++; });
  return n;
}

// ── Material helpers ──────────────────────────────────────────────────

/** PBR override for metal chassis parts (adapts to deviceColor). */
function metalMat(color: string, roughness = 0.06, metalness = 0.95) {
  // MeshPhysicalMaterial adds clearcoat for the polished-titanium/aluminum look
  // that Apple devices have — a thin glassy layer on top of the metal.
  return new THREE.MeshPhysicalMaterial({
    color, roughness, metalness,
    envMapIntensity: 1.8,
    clearcoat: 0.8,
    clearcoatRoughness: 0.04,
    reflectivity: 1.0,
  });
}

/**
 * Ensure a screen mesh has normalised UV coordinates in [0, 1] so that any
 * user texture fills the entire screen.
 *
 * Strategy A – mesh already has UVs: remap their min/max to [0, 1].
 * Strategy B – mesh has NO UVs (e.g. MacBook Pro): generate planar UVs by
 *   projecting from position X/Y (works for any flat-panel screen).
 */
function normalizeScreenUVs(obj: THREE.Mesh, flipU = false) {
  const geom = obj.geometry;
  const pos  = geom.attributes.position as THREE.BufferAttribute | undefined;

  // ── UV-axis orientation check: if U→Y (90° rotated), fall back to Strategy B ──
  // We sample vertices and compute Pearson correlation of U with X and with Y.
  // For standard phone UVs, |corr(U,X)| >> |corr(U,Y)|.
  // For 90°-rotated atlases (e.g. OnePlus 12), |corr(U,Y)| >> |corr(U,X)|.
  if (geom.attributes.uv && pos) {
    const uvAttr = geom.attributes.uv as THREE.BufferAttribute;
    const n = Math.min(uvAttr.count, 300);
    let mx = 0, my = 0, mu = 0;
    for (let i = 0; i < n; i++) {
      mx += pos.getX(i); my += pos.getY(i); mu += uvAttr.getX(i);
    }
    mx /= n; my /= n; mu /= n;
    let sXU = 0, sYU = 0, sXX = 0, sYY = 0, sUU = 0;
    for (let i = 0; i < n; i++) {
      const dx = pos.getX(i) - mx, dy = pos.getY(i) - my, du = uvAttr.getX(i) - mu;
      sXU += dx * du; sYU += dy * du; sXX += dx * dx; sYY += dy * dy; sUU += du * du;
    }
    const corrXU = sXX > 0 && sUU > 0 ? Math.abs(sXU / Math.sqrt(sXX * sUU)) : 0;
    const corrYU = sYY > 0 && sUU > 0 ? Math.abs(sYU / Math.sqrt(sYY * sUU)) : 0;
    // If U strongly correlates with Y (rotated UV atlas), drop existing UVs → Strategy B
    if (corrYU > corrXU + 0.3) {
      geom.deleteAttribute('uv');
    }
  }

  // ── Strategy B: generate planar UVs from position XY ──────────────
  if (!geom.attributes.uv) {
    if (!pos) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const rX = maxX - minX || 1, rY = maxY - minY || 1;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) - minX) / rX;
      uvs[i * 2]     = flipU ? 1 - u : u;
      uvs[i * 2 + 1] = (pos.getY(i) - minY) / rY;
    }
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return;
  }

  // ── Strategy A: remap existing UVs to [0, 1] ──────────────────────
  const uvAttr = geom.attributes.uv as THREE.BufferAttribute;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i), v = uvAttr.getY(i);
    if (u < minU) minU = u; if (u > maxU) maxU = u;
    if (v < minV) minV = v; if (v > maxV) maxV = v;
  }
  const rU = maxU - minU, rV = maxV - minV;
  if (rU < 0.001 || rV < 0.001) return; // degenerate UV island – skip

  // Skip if already approximately [0, 1] (and no flip needed)
  if (!flipU &&
      Math.abs(minU) < 0.005 && Math.abs(1 - maxU) < 0.005 &&
      Math.abs(minV) < 0.005 && Math.abs(1 - maxV) < 0.005) return;

  const uv2 = new Float32Array(uvAttr.count * 2);
  for (let i = 0; i < uvAttr.count; i++) {
    const u = (uvAttr.getX(i) - minU) / rU;
    uv2[i * 2]     = flipU ? 1 - u : u;
    uv2[i * 2 + 1] = (uvAttr.getY(i) - minV) / rV;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv2, 2));
}

const CLAY_MAT = () => new THREE.MeshStandardMaterial({
  color: '#e0dbd0', roughness: 0.90, metalness: 0.0, envMapIntensity: 0.35,
});

/** Classify a mesh name/material key and return the right material (or null to keep original). */
function classifyMesh(
  key: string,
  deviceColor: string,
  screenMeshes: THREE.Mesh[],
  obj: THREE.Mesh,
  flipScreenU = false,
): THREE.Material | null {

  // ── Clay mode — everything except screen becomes flat matte ──────
  if (deviceColor === 'clay') {
    if ((key.includes('display') || key.includes('screen')) && !key.includes('screen2')) {
      normalizeScreenUVs(obj, flipScreenU);
      const mat = new THREE.MeshStandardMaterial({ color: '#020208', roughness: 0.04, metalness: 0 });
      screenMeshes.push(obj);
      return mat;
    }
    if (key.includes('defaultmaterial')) return null;
    return CLAY_MAT();
  }

  // ── Screen / display ─────────────────────────────────────────────
  if ((key.includes('display') || key.includes('screen')) && !key.includes('screen2')) {
    normalizeScreenUVs(obj, flipScreenU);
    const mat = new THREE.MeshStandardMaterial({ color: '#020208', roughness: 0.04, metalness: 0 });
    screenMeshes.push(obj);
    return mat;
  }

  // ── Front glass cover (transparent) ──────────────────────────────
  if (key.includes('glass') && !key.includes('frosted') && !key.includes('tint')
      && !key.includes('back') && !key.includes('camera') && !key.includes('black')) {
    return new THREE.MeshPhysicalMaterial({
      color: '#c8d8ee', metalness: 0.04, roughness: 0.01,
      transmission: 0.88, ior: 1.55, transparent: true, opacity: 0.95,
      envMapIntensity: 1.6,
      reflectivity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
    });
  }

  // ── Back frosted glass ────────────────────────────────────────────
  if (key.includes('frosted_glass') || key.includes('tint_back')) {
    return new THREE.MeshPhysicalMaterial({
      color: '#d8d8d8', roughness: 0.28, metalness: 0.02,
      transmission: 0.55, transparent: true, opacity: 0.97,
      envMapIntensity: 1.1,
    });
  }

  // ── Camera lenses / filters ───────────────────────────────────────
  if (key.includes('lens') || key.includes('camera_filter') || key.includes('led')
      || key.includes('sapphire') || key.includes('mirror_filter')) {
    return new THREE.MeshPhysicalMaterial({
      color: '#020506', roughness: 0.01, metalness: 0.18,
      transmission: 0.22, transparent: true, opacity: 0.97,
      envMapIntensity: 1.8,
      clearcoat: 1.0, clearcoatRoughness: 0.01,
    });
  }

  // ── Metal frame / aluminum / titanium ────────────────────────────
  if (key.includes('aluminum') || key.includes('frame') || key.includes('titanium')) {
    return metalMat(deviceColor || '#71717a');
  }

  // ── Antenna / plastic / screws ────────────────────────────────────
  if (key.includes('antena') || key.includes('plastic') || key.includes('screw')
      || key.includes('usb') || key.includes('speaker')) {
    return new THREE.MeshStandardMaterial({ color: '#0e0e11', roughness: 0.5, metalness: 0.5, envMapIntensity: 0.9 });
  }

  // ── Logo ──────────────────────────────────────────────────────────
  if (key.includes('logo')) {
    return new THREE.MeshPhysicalMaterial({
      color: deviceColor || '#8a8a8e', metalness: 0.98, roughness: 0.02,
      envMapIntensity: 2.0, clearcoat: 1.0, clearcoatRoughness: 0.0, reflectivity: 1.0,
    });
  }

  // ── Watch band / rubber / silicone ───────────────────────────────
  if (key.includes('rubber') || key.includes('silicone') || key.includes('band')) {
    return new THREE.MeshStandardMaterial({
      color: deviceColor || '#1a1a1a', roughness: 0.68, metalness: 0.0, envMapIntensity: 0.5,
    });
  }

  // ── Dark glossy surfaces (watch back cover, ceramic) ─────────────
  if (key.includes('black') || key.includes('glossy') || key.includes('dark_chrome')) {
    return new THREE.MeshPhysicalMaterial({
      color: '#080808', roughness: 0.04, metalness: 0.88,
      envMapIntensity: 1.8, clearcoat: 1.0, clearcoatRoughness: 0.02,
    });
  }

  // ── Sensor / cap (watch health sensors, crown cap) ───────────────
  if (key.includes('sensor') || key.includes('material_')) {
    return new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.22, metalness: 0.60, envMapIntensity: 1.1 });
  }

  // ── Iron / chrome / steel (watch case) ───────────────────────────
  if (key.includes('iron') || key.includes('chrome') || key.includes('steel')) {
    return metalMat(deviceColor || '#a1a1aa');
  }

  // ── Single baked mesh (e.g. defaultMaterial) ──────────────────────
  if (key.includes('defaultmaterial')) {
    return null; // keep original baked texture, just boost env response
  }

  // ── Fallback: generic chassis (hash-named or unknown) ────────────
  return metalMat(deviceColor || '#71717a', 0.10, 0.88);
}

function applyMaterials(
  root: THREE.Object3D,
  deviceColor: string,
  screenMeshes: THREE.Mesh[],
  flipScreenU = false,
) {
  let hasDefaultMat = false;

  root.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Camera || obj instanceof THREE.Light) return;
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    obj.castShadow    = true;
    obj.receiveShadow = true;

    // Never repaint a mesh that has already been identified as the device screen.
    // This prevents deviceColor from bleeding onto the screen when the user
    // changes the frame color.
    if (screenMeshes.includes(obj)) return;

    const key = meshKey(obj);

    if (key.includes('defaultmaterial')) {
      hasDefaultMat = true;
      if (deviceColor === 'clay') {
        obj.material = CLAY_MAT();
      } else {
        // Keep the original baked texture but maximise IBL response for realism
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          const mat = m as THREE.MeshStandardMaterial;
          mat.envMapIntensity = 1.4;
          mat.needsUpdate = true;
        });
      }
      return;
    }

    const mat = classifyMesh(key, deviceColor, screenMeshes, obj, flipScreenU);
    if (mat !== null) obj.material = mat;
  });

  return hasDefaultMat;
}

/**
 * Geometric screen detection for models where no named screen was found.
 * Traverses the mounted group (world coords) to find the flattest large mesh at the front.
 */
function detectAndMarkScreen(
  root: THREE.Object3D,
  screenFaceZ: number,
  screenMeshes: THREE.Mesh[],
) {
  if (screenMeshes.length > 0) return; // already found by name

  let bestMesh: THREE.Mesh | null = null;
  let bestScore = -Infinity;

  const localBox  = new THREE.Box3();
  const localSize = new THREE.Vector3();
  const localCtr  = new THREE.Vector3();

  root.traverse((obj: THREE.Object3D) => {
    if (!(obj instanceof THREE.Mesh)) return;
    localBox.setFromObject(obj);
    localBox.getSize(localSize);
    localBox.getCenter(localCtr);

    // Must be at the front face (world Z > 50% of screenFaceZ)
    if (localCtr.z < 0.5 * screenFaceZ) return;

    const thinness = 1 / (localSize.z + 1e-6);
    const area = localSize.x * localSize.y;
    const score = thinness * area;
    if (score > bestScore) { bestScore = score; bestMesh = obj; }
  });

  if (bestMesh) {
    normalizeScreenUVs(bestMesh as THREE.Mesh);
    (bestMesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
      color: '#020208', roughness: 0.04, metalness: 0,
    });
    screenMeshes.push(bestMesh as THREE.Mesh);
  }
}

// ── Screen overlay ────────────────────────────────────────────────────

interface OverlayProps {
  sW: number; sH: number; sOffY: number;
  screenFaceZ: number;
  facesNeg: boolean;
  /** Corner radius in Three.js world units (0 = rectangular). */
  cornerRadius: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}

function ScreenOverlay({ sW, sH, sOffY, screenFaceZ, facesNeg, cornerRadius, screenTexture, contentType }: OverlayProps) {
  // Build a rounded-rectangle geometry with correct UVs.
  // Dispose the previous geometry whenever dimensions change.
  const geom = useMemo(() => {
    if (cornerRadius <= 0.001) return new THREE.PlaneGeometry(sW, sH);
    return makeRoundedRectGeom(sW, sH, cornerRadius);
  }, [sW, sH, cornerRadius]);

  useEffect(() => () => { geom.dispose(); }, [geom]);

  // Create the material ONCE imperatively so React/R3F reconciliation can never
  // reset mat.map or mat.color between renders (the root cause of content
  // disappearing when deviceColor changes). The mesh receives it via the
  // `material` prop — R3F only stores the reference, never mutates properties.
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#000000',
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  }), []);
  useEffect(() => () => { mat.dispose(); }, [mat]);

  const ctRef = useRef(contentType);
  ctRef.current = contentType;

  useFrame(() => {
    const tex = screenTexture.current;
    if (tex) {
      const needMap   = mat.map !== tex;
      const needColor = mat.color.r < 0.99;
      if (needMap || needColor) {
        if (needMap)   mat.map = tex;
        if (needColor) mat.color.set('#ffffff');
        mat.needsUpdate = true;
      }
      if (ctRef.current === 'video') tex.needsUpdate = true;
    } else if (mat.map || mat.color.r > 0.01) {
      mat.map = null;
      mat.color.set('#000000');
      mat.needsUpdate = true;
    }
  });

  // Place just in front of the screen face.
  // depthWrite: true ensures back-face camera modules are properly occluded.
  // DoubleSide makes the plane visible regardless of its normal orientation.
  const OFFSET = 0.012;
  const zPos = facesNeg ? screenFaceZ - OFFSET : screenFaceZ + OFFSET;
  const rotX = facesNeg ? Math.PI : 0;

  return (
    <mesh
      geometry={geom}
      material={mat}
      position={[0, sOffY, zPos]}
      rotation={[rotX, 0, 0]}
      renderOrder={4}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────

interface Props {
  def: DeviceModelDef;
  deviceColor: string;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  isLandscape?: boolean;
}

export function GLBDeviceModel({ def, deviceColor, screenTexture, contentType }: Props) {
  const gltf    = useGLTF(def.glbUrl!) as any;
  const sceneObj: THREE.Object3D | null =
    gltf?.scene ?? gltf?.scenes?.[0] ?? null;

  // ── Compute transform + screen dims in a single memo pass ─────────
  const transform = useMemo<ModelTransform | null>(() => {
    if (!sceneObj) return null;
    return computeTransform(sceneObj, def);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneObj]);

  // ── Apply / update materials when model or color changes ──────────
  const groupRef      = useRef<THREE.Group>(null);
  const screenMeshes  = useRef<THREE.Mesh[]>([]);
  const prevTransform = useRef<ModelTransform | null>(null);

  useEffect(() => {
    const root = groupRef.current;
    if (!root || !transform) return;

    // Only reset the identified screen meshes when the model itself changes.
    // When only deviceColor changes, keep screenMeshes intact so applyMaterials
    // can skip them and never paint the screen with the frame color.
    const modelChanged = prevTransform.current !== transform;
    prevTransform.current = transform;
    if (modelChanged) screenMeshes.current = [];

    const hasBaked = applyMaterials(root, deviceColor, screenMeshes.current, !!def.screenFacesBack);

    // For multi-mesh models that didn't have an explicitly named screen mesh,
    // detect it geometrically from world-space positions (group transforms applied).
    if (modelChanged && !hasBaked && screenMeshes.current.length === 0) {
      detectAndMarkScreen(root, transform.screenFaceZ, screenMeshes.current);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceColor, transform]);

  // ── Sync screen texture into detected screen meshes (multi-mesh) ──
  const ctRef = useRef(contentType);
  ctRef.current = contentType;

  useFrame(() => {
    const tex = screenTexture.current;
    screenMeshes.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (tex) {
        const needMap   = mat.map !== tex;
        const needColor = mat.color.r < 0.99;
        if (needMap || needColor) {
          if (needMap)   mat.map = tex;
          if (needColor) mat.color.set('#ffffff');
          mat.needsUpdate = true;
        }
        if (ctRef.current === 'video') tex.needsUpdate = true;
      } else if (mat.map || mat.color.r > 0.04) {
        mat.map = null;
        mat.color.set('#020208');
        mat.needsUpdate = true;
      }
    });
  });

  if (!sceneObj || !transform) return null;

  const { scale, position, rotation, screenFaceZ, screenFacesNeg, modelWidth, detectedScreen } = transform;

  // ── Screen overlay dimensions ─────────────────────────────────────
  // Priority: detected from 3D geometry > proportional from def.w/h
  let sW: number, sH: number, sOffY: number;
  if (detectedScreen) {
    ({ sW, sH, sOffY } = detectedScreen);
  } else {
    // Fallback: derive from device definition proportions
    const screenWFrac = (def.w - def.insetSide * 2) / def.w;
    const screenHFrac = (def.h - def.insetTop - def.insetBottom) / def.h;
    const topHeavy    = (def.insetTop - def.insetBottom) / def.h;
    sW    = modelWidth * screenWFrac;
    sH    = TARGET_H  * screenHFrac;
    sOffY = -TARGET_H * topHeavy;
  }

  // ── Corner radius for the overlay ────────────────────────────────
  // Convert def.screenBr (CSS) to Three.js world units using screen width.
  const screenBrPx    = parseScreenBrPx(def.screenBr);
  const screenWidthPx = def.w - def.insetSide * 2;
  const cornerRadius  = screenBrPx > 0 && screenWidthPx > 0
    ? Math.min(screenBrPx * (sW / screenWidthPx), Math.min(sW, sH) * 0.45)
    : 0;

  return (
    <>
      {/* 3D model */}
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        <primitive object={sceneObj} />
      </group>

      {/* Screen content overlay — world-space plane aligned with front face.
          Skipped for laptops/angled screens where the texture is applied
          directly to the detected screen mesh (def.skipOverlay = true). */}
      {!def.skipOverlay && (
        <ScreenOverlay
          sW={sW}
          sH={sH}
          sOffY={sOffY}
          screenFaceZ={screenFaceZ}
          facesNeg={screenFacesNeg}
          cornerRadius={cornerRadius}
          screenTexture={screenTexture}
          contentType={contentType}
        />
      )}
    </>
  );
}
