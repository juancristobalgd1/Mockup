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

// ── GLB coordinate math ───────────────────────────────────────────
// The GLB was exported from 3ds Max in Z-up convention:
//   X: 0.336 – 24.928  (width,    center = 12.632)
//   Y: 0.849 – 1.445   (depth,    center =  1.147)
//   Z: 0.200 – 50.436  (height,   center = 25.318)
//
// We apply a single group transform: position P, rotation R(-90°,X), scale S
// where S = 2.5 / 50.236 = 0.04977  (phone = 2.5 Three.js units tall)
//
// position P must equal  -(R(S(center)))  so the model is centered at world origin:
//   S(center)     = 0.04977 * (12.632, 1.147, 25.318) = (0.629, 0.057, 1.261)
//   R(-90°,X)(v)  maps (x,y,z) → (x, z, -y)         = (0.629, 1.261, -0.057)
//   P             = -(0.629, 1.261, -0.057)           = (-0.629, -1.261, 0.057)
const MODEL_SCALE = 0.04977;
const MODEL_POS: [number, number, number] = [-0.629, -1.261, 0.057];
const MODEL_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];

export function IPhone13ProGLBModel({ deviceColor, screenTexture, contentType }: Props) {
  const { scene } = useGLTF(MODEL_URL) as any;
  const screenMeshes = useRef<THREE.Mesh[]>([]);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    screenMeshes.current = [];

    clone.traverse((obj: THREE.Object3D) => {
      // Remove embedded cameras / lights from the 3ds Max export
      if (obj instanceof THREE.Camera || obj instanceof THREE.Light) {
        obj.removeFromParent();
        return;
      }
      if (!(obj instanceof THREE.Mesh)) return;
      obj.frustumCulled = false;
      obj.castShadow    = true;
      obj.receiveShadow = true;

      const name = obj.name.toLowerCase();

      if (name.startsWith('screen') && !name.startsWith('screen2')) {
        // OLED display face
        obj.material = new THREE.MeshStandardMaterial({
          color: '#020208', roughness: 0.04, metalness: 0,
        });
        screenMeshes.current.push(obj);

      } else if (name.startsWith('screen2')) {
        // Front cover glass — thin tinted gloss
        obj.material = new THREE.MeshPhysicalMaterial({
          color: '#a0c0e0', transmission: 0.85, roughness: 0,
          metalness: 0, transparent: true, opacity: 0.06, envMapIntensity: 2.0,
        });

      } else if (name.startsWith('lens') || name.startsWith('still') || name.startsWith('led')) {
        // Camera lenses and optical elements
        obj.material = new THREE.MeshPhysicalMaterial({
          color: '#040810', roughness: 0.02, metalness: 0.15,
          transmission: 0.18, transparent: true, opacity: 0.95, envMapIntensity: 3.5,
        });

      } else if (name.startsWith('glass')) {
        // Back glass panel
        obj.material = new THREE.MeshPhysicalMaterial({
          color: deviceColor || '#71717a', metalness: 0.08, roughness: 0.06,
          transmission: 0.20, transparent: true, opacity: 0.97, envMapIntensity: 3.0,
        });

      } else if (name.startsWith('plastic') || name.startsWith('plastic2')) {
        // Rubber antenna bands
        obj.material = new THREE.MeshStandardMaterial({
          color: '#1a1a1e', metalness: 0.0, roughness: 0.6,
        });

      } else if (name.startsWith('speaker')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#111114', metalness: 0.35, roughness: 0.72,
        });

      } else if (name.startsWith('logo')) {
        obj.material = new THREE.MeshStandardMaterial({
          color: deviceColor || '#8a8a8e', metalness: 0.96, roughness: 0.05, envMapIntensity: 2.8,
        });

      } else if (name.startsWith('balck') || name.startsWith('123')) {
        // Camera module housing rings
        obj.material = new THREE.MeshStandardMaterial({
          color: '#0d0d10', metalness: 0.65, roughness: 0.22,
        });

      } else {
        // Korean-named chassis meshes — device color
        obj.material = new THREE.MeshStandardMaterial({
          color: deviceColor || '#71717a', metalness: 0.88, roughness: 0.10, envMapIntensity: 2.2,
        });
      }
    });

    return clone;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, deviceColor]);

  // Reactively update screen texture (texture ref updates asynchronously)
  const prevTex = useRef<THREE.Texture | null>(null);
  const prevCt  = useRef<string | null>(null);
  const ctRef   = useRef(contentType);
  ctRef.current = contentType;

  useFrame(() => {
    const tex = screenTexture.current;
    const ct  = ctRef.current;
    if (tex === prevTex.current && ct === prevCt.current) return;
    prevTex.current = tex;
    prevCt.current  = ct;

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
    <group position={MODEL_POS} rotation={MODEL_ROT} scale={MODEL_SCALE}>
      <primitive object={cloned} />
    </group>
  );
}
