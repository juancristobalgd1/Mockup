import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

interface Props {
  def: DeviceModelDef;
  deviceColor: string;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  isLandscape?: boolean;
}

const MODEL_URL = '/models/iphone13pro.glb';
useGLTF.preload(MODEL_URL);

// ── GLB coordinate math ───────────────────────────────────────────
// 3ds Max export → Z-up:  X=width(0-24.9), Y=depth(0.8-1.4), Z=height(0-50.4)
// We want: phone stands upright (Z→Y), scale so height=2.5 units, center at world origin.
//
// Single group with position P, rotation R(-90°,X), scale S:
//   S = 2.5 / 50.236 = 0.04977
//   Center in GLB space: (12.632, 1.147, 25.318)
//   After S:            (0.629, 0.057, 1.261)
//   After R(-90°,X) maps (x,y,z)→(x, z, -y): (0.629, 1.261, -0.057)
//   P = -(0.629, 1.261, -0.057) = (-0.629, -1.261, 0.057)
//
const MODEL_SCALE = 0.04977;
const MODEL_POS: [number, number, number] = [-0.629, -1.261, 0.057];
const MODEL_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];

export function IPhone13ProGLBModel({ deviceColor, screenTexture, contentType }: Props) {
  const gltf       = useGLTF(MODEL_URL) as any;
  const groupRef   = useRef<THREE.Group>(null);
  const screenMeshes = useRef<THREE.Mesh[]>([]);
  const setupDone  = useRef(false);

  // Apply PBR materials once after mount (and on deviceColor change)
  useEffect(() => {
    const root = groupRef.current;
    if (!root) return;
    screenMeshes.current = [];
    setupDone.current = false;

    const isClay = deviceColor === 'clay';

    root.traverse((obj: THREE.Object3D) => {
      // Skip cameras/lights from 3ds Max
      if (obj instanceof THREE.Camera || obj instanceof THREE.Light) return;
      if (!(obj instanceof THREE.Mesh)) return;

      obj.frustumCulled = false;
      obj.castShadow    = true;
      obj.receiveShadow = true;

      const name = obj.name.toLowerCase();

      if (name.startsWith('screen') && !name.startsWith('screen2')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#020208', roughness: 0.04, metalness: 0,
        });
        screenMeshes.current.push(obj);

      } else if (isClay) {
        // Clay mode: flat matte for all non-screen surfaces
        obj.material = new THREE.MeshStandardMaterial({
          color: '#e0dbd0', roughness: 0.90, metalness: 0.0, envMapIntensity: 0.35,
        });

      } else if (name.startsWith('screen2')) {
        obj.material = new THREE.MeshPhysicalMaterial({
          color: '#a0c0e0', transmission: 0.8, roughness: 0,
          metalness: 0, transparent: true, opacity: 0.07, envMapIntensity: 0.9,
        });

      } else if (name.startsWith('lens') || name.startsWith('still') || name.startsWith('led')) {
        obj.material = new THREE.MeshPhysicalMaterial({
          color: '#040810', roughness: 0.02, metalness: 0.1,
          transmission: 0.15, transparent: true, opacity: 0.95, envMapIntensity: 1.4,
        });

      } else if (name.startsWith('glass')) {
        obj.material = new THREE.MeshPhysicalMaterial({
          color: deviceColor || '#71717a', metalness: 0.08, roughness: 0.06,
          transmission: 0.15, transparent: true, opacity: 0.98, envMapIntensity: 1.3,
        });

      } else if (name.startsWith('plastic')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#1a1a1e', metalness: 0, roughness: 0.6,
        });

      } else if (name.startsWith('speaker')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#111114', metalness: 0.35, roughness: 0.72,
        });

      } else if (name.startsWith('logo')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: deviceColor || '#8a8a8e', metalness: 0.96, roughness: 0.05, envMapIntensity: 1.2,
        });

      } else if (name.startsWith('balck') || name.startsWith('123')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#0d0d10', metalness: 0.65, roughness: 0.22,
        });

      } else {
        // Korean-named chassis meshes → device color
        obj.material = new THREE.MeshStandardMaterial({
          color: deviceColor || '#71717a', metalness: 0.88, roughness: 0.10, envMapIntensity: 1.0,
        });
      }
    });

    setupDone.current = true;

    // After creating new screen materials, immediately re-apply any existing
    // texture so there's no flash of the dark screen between frames.
    const tex = screenTexture.current;
    screenMeshes.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (tex) {
        mat.map = tex;
        mat.color.set('#ffffff');
        mat.needsUpdate = true;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceColor]);

  // Update screen texture every frame
  const prevTex = useRef<THREE.Texture | null>(null);
  const ctRef   = useRef(contentType);
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
    prevTex.current = tex;
  });

  // Gather the GLTF scene — handle different drei return shapes
  const sceneObj: THREE.Object3D | null =
    gltf?.scene ?? gltf?.scenes?.[0] ?? null;

  if (!sceneObj) return null;

  return (
    <group ref={groupRef} position={MODEL_POS} rotation={MODEL_ROT} scale={MODEL_SCALE}>
      <primitive object={sceneObj} />
    </group>
  );
}
