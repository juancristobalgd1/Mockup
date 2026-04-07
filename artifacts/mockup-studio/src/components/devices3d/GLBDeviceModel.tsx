/**
 * GLBDeviceModel — universal loader for any GLB phone model.
 *
 * Handles two export conventions automatically:
 *   Y-up (glTF spec): no extra rotation  →  e.g. iPhone 14 Pro from Sketchfab
 *   Z-up (3ds Max):   rotate -90° on X   →  e.g. iPhone 13 Pro hand-scanned ZIP
 *
 * Centers and scales the model to 2.5 Three.js units tall.
 * Overlays a screen content plane in WORLD space so it's always aligned.
 */

import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

const TARGET_H = 2.5;

// ── Transform computation ──────────────────────────────────────────

interface ModelTransform {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  /** World-space Z of the front/screen face */
  screenFaceZ: number;
  /** true when model was Z-up — screen faces −Z in world space */
  screenFacesNeg: boolean;
}

function computeTransform(sceneObj: THREE.Object3D): ModelTransform {
  const box    = new THREE.Box3().setFromObject(sceneObj);
  const size   = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Identify tallest axis
  const isZUp = size.z > size.y * 1.4 && size.z > size.x * 1.4;
  const tall   = isZUp ? size.z : size.y;
  const s      = TARGET_H / tall;

  if (isZUp) {
    // 3ds Max Z-up: rotate -90° around X maps GLB-Z → Three.js-Y
    // Transform rule on a vertex v: world = T + R(-90°X) * (S * v)
    //   R(-90°X): (x,y,z) → (x, z, −y)
    //   World center = (cx·s,  cz·s, −cy·s)
    //   T = −world_center = (−cx·s, −cz·s, cy·s)
    const rotation: [number,number,number] = [-Math.PI/2, 0, 0];
    const position: [number,number,number] = [
      -center.x * s,
      -center.z * s,
       center.y * s,
    ];
    // Screen face is at box.max.y in GLB (screen faces +Y in 3ds Max).
    // After rotation: GLB +Y → Three.js -Z.
    // World Z of screen = T_z + (−maxY · s) = cy·s − maxY·s = −(maxY−cy)·s
    const screenFaceZ = -(box.max.y - center.y) * s;
    return { scale: s, position, rotation, screenFaceZ, screenFacesNeg: true };
  }

  // Y-up — standard glTF, no rotation
  const rotation: [number,number,number] = [0, 0, 0];
  const position: [number,number,number] = [
    -center.x * s,
    -center.y * s,
    -center.z * s,
  ];
  // Screen faces +Z (toward camera at +Z). Front face = box.max.z.
  // World Z = T_z + maxZ·s = −cz·s + maxZ·s = (maxZ−cz)·s
  const screenFaceZ = (box.max.z - center.z) * s;
  return { scale: s, position, rotation, screenFaceZ, screenFacesNeg: false };
}

// ── Screen content plane ───────────────────────────────────────────

interface OverlayProps {
  sW: number; sH: number; sOffY: number;
  screenFaceZ: number;
  facesNeg: boolean;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}

function ScreenOverlay({ sW, sH, sOffY, screenFaceZ, facesNeg, screenTexture, contentType }: OverlayProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const tex = screenTexture.current;
    if (tex && mat.map !== tex) {
      mat.map = tex;
      mat.color.set('#ffffff');
      mat.needsUpdate = true;
    } else if (!tex && mat.map) {
      mat.map = null;
      mat.color.set('#000000');
      mat.needsUpdate = true;
    }
    if (contentType === 'video' && tex) tex.needsUpdate = true;
  });

  // Place overlay 2mm (world) in front of the model face
  const zPos = facesNeg ? screenFaceZ - 0.003 : screenFaceZ + 0.003;
  // Flip plane to face −Z when screen faces −Z (Z-up models seen from behind camera's default)
  const rotX = facesNeg ? Math.PI : 0;

  return (
    <mesh
      ref={meshRef}
      position={[0, sOffY, zPos]}
      rotation={[rotX, 0, 0]}
      renderOrder={3}
    >
      <planeGeometry args={[sW, sH]} />
      <meshBasicMaterial color="#000000" toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

// ── Material override on model meshes ──────────────────────────────

function applyMaterials(root: THREE.Object3D, deviceColor: string, screenMeshes: THREE.Mesh[]) {
  root.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Camera || obj instanceof THREE.Light) return;
    if (!(obj instanceof THREE.Mesh)) return;
    obj.frustumCulled = false;
    obj.castShadow    = true;
    obj.receiveShadow = true;

    const name = obj.name.toLowerCase();

    if (name.startsWith('screen') && !name.startsWith('screen2')) {
      obj.material = new THREE.MeshStandardMaterial({ color: '#020208', roughness: 0.04, metalness: 0 });
      screenMeshes.push(obj);
    } else if (name.startsWith('screen2')) {
      obj.material = new THREE.MeshPhysicalMaterial({
        color: '#a0c0e0', transmission: 0.8, roughness: 0, metalness: 0, transparent: true, opacity: 0.07,
      });
    } else if (name.startsWith('lens') || name.startsWith('still') || name.startsWith('led')) {
      obj.material = new THREE.MeshPhysicalMaterial({
        color: '#030608', roughness: 0.02, metalness: 0.1, transmission: 0.15, transparent: true, opacity: 0.96,
      });
    } else if (name.startsWith('glass')) {
      obj.material = new THREE.MeshPhysicalMaterial({
        color: deviceColor || '#71717a', metalness: 0.08, roughness: 0.06, transmission: 0.15, transparent: true, opacity: 0.98,
      });
    } else if (name.startsWith('logo')) {
      obj.material = new THREE.MeshStandardMaterial({
        color: deviceColor || '#8a8a8e', metalness: 0.96, roughness: 0.05, envMapIntensity: 2.8,
      });
    } else if (name.startsWith('balck') || name.startsWith('123') || name.startsWith('plastic') || name.startsWith('speaker')) {
      obj.material = new THREE.MeshStandardMaterial({ color: '#0e0e11', metalness: 0.5, roughness: 0.45 });
    } else if (name === 'defaultmaterial') {
      // Baked single-mesh — keep original texture, just boost environment response
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => { (m as THREE.MeshStandardMaterial).envMapIntensity = 1.4; });
    } else {
      // Korean-named / generic chassis
      obj.material = new THREE.MeshStandardMaterial({
        color: deviceColor || '#71717a', metalness: 0.88, roughness: 0.10, envMapIntensity: 2.2,
      });
    }
  });
}

// ── Main component ─────────────────────────────────────────────────

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

  // ── Compute transform once (from raw scene bounding box)
  const transform = useMemo<ModelTransform | null>(() => {
    if (!sceneObj) return null;
    return computeTransform(sceneObj);
  }, [sceneObj]);

  // ── Apply materials after mount and on color change
  const groupRef     = useRef<THREE.Group>(null);
  const screenMeshes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const root = groupRef.current;
    if (!root) return;
    screenMeshes.current = [];
    applyMaterials(root, deviceColor, screenMeshes.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceColor]);

  // ── Update screen texture into named screen meshes (multi-mesh models)
  const prevTex = useRef<THREE.Texture | null>(null);
  const ctRef   = useRef(contentType);
  ctRef.current = contentType;

  useFrame(() => {
    const tex = screenTexture.current;
    if (tex !== prevTex.current) {
      prevTex.current = tex;
      screenMeshes.current.forEach(mesh => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map = tex ?? null;
        mat.color.set(tex ? '#ffffff' : '#020208');
        mat.needsUpdate = true;
      });
    }
    if (ctRef.current === 'video' && tex) tex.needsUpdate = true;
  });

  if (!sceneObj || !transform) return null;

  const { scale, position, rotation, screenFaceZ, screenFacesNeg } = transform;

  // ── Screen overlay dimensions from device definition
  const ratio = def.h > 0 ? TARGET_H / (def.h / 100) : 1;
  const pW    = (def.w / 100) * ratio;
  const iTop  = (def.insetTop    / 100) * ratio;
  const iBot  = (def.insetBottom / 100) * ratio;
  const iSide = (def.insetSide   / 100) * ratio;
  const sW    = pW - iSide * 2;
  const sH    = TARGET_H - iTop - iBot;
  const sOffY = -(iTop - iBot) / 2;

  return (
    <>
      {/* Model */}
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        <primitive object={sceneObj} />
      </group>

      {/* Screen content overlay — in WORLD space, aligned with front face */}
      <ScreenOverlay
        sW={sW}
        sH={sH}
        sOffY={sOffY}
        screenFaceZ={screenFaceZ}
        facesNeg={screenFacesNeg}
        screenTexture={screenTexture}
        contentType={contentType}
      />
    </>
  );
}
