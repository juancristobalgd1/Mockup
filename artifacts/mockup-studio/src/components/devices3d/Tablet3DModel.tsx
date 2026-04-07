import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

interface Props {
  def: DeviceModelDef;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  isLandscape: boolean;
}

function ScreenPlane({
  w, h, screenTexture, contentType,
}: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const tex = screenTexture.current;
    if (tex) {
      const needMap   = mat.map !== tex;
      const needColor = mat.color.r < 0.99;
      if (needMap || needColor) {
        if (needMap)   mat.map = tex;
        if (needColor) mat.color.set('#ffffff');
        mat.needsUpdate = true;
      }
      if (contentType === 'video') tex.needsUpdate = true;
    } else if (mat.map || mat.color.r > 0.04) {
      mat.map = null;
      mat.color.set('#050510');
      mat.needsUpdate = true;
    }
  });
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color="#050510" toneMapped={false} />
    </mesh>
  );
}

export function Tablet3DModel({ def, screenTexture, contentType, isLandscape }: Props) {
  const scale = 2.4 / (def.h / 100);
  const pW = (def.w / 100) * scale;
  const pH = (def.h / 100) * scale;
  const pD = 0.075;

  const insetH = (def.insetTop + def.insetBottom) / 100 * scale;
  const insetW = def.insetSide / 100 * scale * 2;
  const sW = pW - insetW;
  const sH = pH - insetH;
  const sZ = pD / 2 + 0.001;

  const bodyColor = '#2a2a2e';

  return (
    <group rotation={isLandscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}>
      {/* Body */}
      <RoundedBox args={[pW, pH, pD]} radius={0.06} smoothness={6} castShadow>
        <meshStandardMaterial color={bodyColor} metalness={0.75} roughness={0.15} envMapIntensity={1.2} />
      </RoundedBox>

      {/* Screen black */}
      <mesh position={[0, 0, sZ]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#050510" roughness={0.08} metalness={0} />
      </mesh>

      {/* Screen content */}
      <group position={[0, 0, sZ + 0.001]}>
        <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
      </group>

      {/* Screen gloss */}
      <mesh position={[0, 0, sZ + 0.003]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.03} roughness={0.02} metalness={0} />
      </mesh>

      {/* Front camera */}
      <mesh position={[0, pH / 2 - def.insetTop / 100 * scale * 0.5, sZ + 0.003]}>
        <circleGeometry args={[0.018, 24]} />
        <meshStandardMaterial color="#111" roughness={0.1} />
      </mesh>

      {/* Home button (older iPad) */}
      {def.insetBottom > 30 && (
        <mesh position={[0, -pH / 2 + def.insetBottom / 100 * scale * 0.55, sZ + 0.003]}>
          <circleGeometry args={[0.04, 32]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.3} metalness={0.5} />
        </mesh>
      )}

      {/* Power button (top right edge) */}
      <group position={[pW / 2 + 0.005, pH * 0.35, 0]}>
        <RoundedBox args={[0.01, pH * 0.08, 0.06]} radius={0.003} smoothness={3}>
          <meshStandardMaterial color={bodyColor} metalness={0.75} roughness={0.2} />
        </RoundedBox>
      </group>

      {/* Back camera */}
      <mesh position={[pW * 0.35, pH * 0.42, -pD / 2 - 0.003]}>
        <circleGeometry args={[0.035, 32]} />
        <meshStandardMaterial color="#111" roughness={0.05} metalness={0.4} />
      </mesh>
    </group>
  );
}
