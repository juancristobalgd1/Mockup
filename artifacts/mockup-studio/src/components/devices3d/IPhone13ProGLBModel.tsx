import { useMemo, useRef } from 'react';
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

// GLB bounding data (measured from accessors):
//   X: 0.336 – 24.928  → centerX ≈ 12.63
//   Z: 0.200 – 50.436  → centerZ ≈ 25.32
// Model lies flat → rotate -90° around X so Z becomes Y (height)
const CENTER_X = -12.63;
const CENTER_Z = -25.32;
const SCALE = 0.0498; // 50.2 units × 0.0498 ≈ 2.5 unit tall phone

export function IPhone13ProGLBModel({ deviceColor, screenTexture, contentType }: Props) {
  const { scene } = useGLTF(MODEL_URL) as any;
  const screenMeshes = useRef<THREE.Mesh[]>([]);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    screenMeshes.current = [];

    clone.traverse((obj: THREE.Object3D) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = obj.name.toLowerCase();

      // Disable frustum culling so model renders at all camera angles
      obj.frustumCulled = false;

      if (name.startsWith('screen') && !name.startsWith('screen2')) {
        // OLED screen face — will receive user content
        const mat = new THREE.MeshStandardMaterial({
          color: '#020208',
          roughness: 0.04,
          metalness: 0,
        });
        obj.material = mat;
        screenMeshes.current.push(obj);

      } else if (name.startsWith('screen2')) {
        // Front glass overlay — thin tinted glass effect
        obj.material = new THREE.MeshPhysicalMaterial({
          color: '#90b8e0',
          transmission: 0.88,
          roughness: 0.0,
          metalness: 0,
          transparent: true,
          opacity: 0.06,
          envMapIntensity: 2.5,
        });

      } else if (name.includes('e??') || name.includes('\xef\xbf\xbd')) {
        // Body / aluminum frame (Korean-named meshes are the chassis)
        obj.material = new THREE.MeshStandardMaterial({
          color: deviceColor || '#71717a',
          metalness: 0.88,
          roughness: 0.14,
          envMapIntensity: 2.0,
        });

      } else if (name.startsWith('lens') || name.startsWith('still') || name.startsWith('led')) {
        // Camera lenses and optical glass elements
        obj.material = new THREE.MeshPhysicalMaterial({
          color: '#040810',
          roughness: 0.02,
          metalness: 0.15,
          transmission: 0.18,
          transparent: true,
          opacity: 0.95,
          envMapIntensity: 3.5,
        });

      } else if (name.startsWith('glass')) {
        // Back glass panel
        obj.material = new THREE.MeshPhysicalMaterial({
          color: deviceColor || '#71717a',
          metalness: 0.08,
          roughness: 0.06,
          transmission: 0.22,
          transparent: true,
          opacity: 0.97,
          envMapIntensity: 3.0,
        });

      } else if (name.startsWith('plastic')) {
        // Rubber / antenna band
        obj.material = new THREE.MeshStandardMaterial({
          color: '#1a1a1e',
          metalness: 0.0,
          roughness: 0.6,
        });

      } else if (name.startsWith('speaker')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#111114',
          metalness: 0.35,
          roughness: 0.72,
        });

      } else if (name.startsWith('logo')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: deviceColor || '#8a8a8e',
          metalness: 0.96,
          roughness: 0.05,
          envMapIntensity: 2.8,
        });

      } else if (name.startsWith('balck') || name.startsWith('123')) {
        // Camera module housing
        obj.material = new THREE.MeshStandardMaterial({
          color: '#0d0d10',
          metalness: 0.65,
          roughness: 0.22,
        });
      }
    });

    return clone;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, deviceColor]);

  // Use refs so useFrame always reads the latest values
  const contentTypeRef = useRef(contentType);
  contentTypeRef.current = contentType;

  const lastTexRef = useRef<THREE.Texture | null>(null);
  const lastContentTypeRef = useRef<string | null>(null);

  useFrame(() => {
    const tex = screenTexture.current;
    const ct = contentTypeRef.current;
    // Only update when something changed
    if (tex === lastTexRef.current && ct === lastContentTypeRef.current) return;
    lastTexRef.current = tex;
    lastContentTypeRef.current = ct;

    screenMeshes.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (tex && ct) {
        mat.map = tex;
        mat.color.set('#ffffff');
      } else {
        mat.map = null;
        mat.color.set('#020208');
      }
      mat.needsUpdate = true;
    });
  });

  return (
    <group>
      {/*
        Rotate -90° around X: model lies flat (Y-up in source = Z-up in GLB convention)
        → After rotation, Z becomes Y so the phone stands upright in Three.js Y-up world
        Translate to center the model bounding box at world origin
      */}
      <group
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CENTER_X * SCALE, 0, CENTER_Z * SCALE]}
        scale={SCALE}
      >
        <primitive object={cloned} />
      </group>
    </group>
  );
}
