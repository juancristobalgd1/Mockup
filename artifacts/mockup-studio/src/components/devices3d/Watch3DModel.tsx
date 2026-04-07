import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

interface Props {
  def: DeviceModelDef;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}

function ScreenPlane({ w, h, screenTexture, contentType }: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const tex = screenTexture.current;
    if (tex && mat.map !== tex) { mat.map = tex; mat.needsUpdate = true; }
    else if (!tex && mat.map) { mat.map = null; mat.needsUpdate = true; }
    if (contentType === 'video' && tex) tex.needsUpdate = true;
  });
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color="#050510" toneMapped={false} />
    </mesh>
  );
}

/** Realistic watch band segment with stitching detail */
function BandSegment({ x, y, z, w, h, d, color }: {
  x: number; y: number; z: number; w: number; h: number; d: number; color: string;
}) {
  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[w, h, d]} radius={w * 0.05} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.65} metalness={0.02} envMapIntensity={0.4} />
      </RoundedBox>
      {/* Stitching line left */}
      <mesh position={[-w * 0.38, 0, d / 2 + 0.001]}>
        <planeGeometry args={[0.003, h * 0.9]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} roughness={1} />
      </mesh>
      {/* Stitching line right */}
      <mesh position={[w * 0.38, 0, d / 2 + 0.001]}>
        <planeGeometry args={[0.003, h * 0.9]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} roughness={1} />
      </mesh>
    </group>
  );
}

/** Watch band holes row */
function BandHoles({ w, startY, count, gap, z }: {
  w: number; startY: number; count: number; gap: number; z: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, startY - i * gap, z]}>
          <cylinderGeometry args={[0.018, 0.018, 0.04, 12]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </>
  );
}

export function Watch3DModel({ def, screenTexture, contentType }: Props) {
  const isUltra = def.id.includes('ultra');

  const scale = 1.8 / (def.h / 100);
  const pW = (def.w / 100) * scale;
  const pH = (def.h / 100) * scale;
  const pD = isUltra ? 0.135 : 0.120;

  // Case border radius: rounded rect (not full oval)
  const br = isUltra ? 0.20 : 0.28;

  const bodyColor = isUltra ? '#2c2520' : '#1a1a1e';
  const metalness = isUltra ? 0.92 : 0.78;
  const roughness = isUltra ? 0.08 : 0.14;

  const insetS = def.insetSide / 100 * scale;
  const sW = pW - insetS * 2;
  const sH = pH - insetS * 2;
  const sZ = pD / 2 + 0.003;

  const bandColor = isUltra ? '#f97316' : '#e11d48';
  const bandW = pW * 0.78;
  const upperBandH = pH * 0.55;
  const lowerBandH = pH * 0.48;

  return (
    <group>
      {/* Upper band (with holes near lug) */}
      <BandSegment
        x={0} y={pH / 2 + upperBandH / 2} z={-pD * 0.15}
        w={bandW} h={upperBandH} d={pD * 0.72}
        color={bandColor}
      />
      <BandHoles
        w={bandW}
        startY={pH / 2 + upperBandH * 0.25}
        count={5} gap={upperBandH * 0.10}
        z={pD * 0.23}
      />

      {/* Lower band */}
      <BandSegment
        x={0} y={-pH / 2 - lowerBandH / 2} z={-pD * 0.15}
        w={bandW} h={lowerBandH} d={pD * 0.72}
        color={bandColor}
      />

      {/* Band clasp (lower) */}
      <group position={[0, -pH / 2 - lowerBandH * 0.62, 0]}>
        <RoundedBox args={[bandW * 0.7, 0.04, pD * 0.72]} radius={0.008} smoothness={3}>
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.18} />
        </RoundedBox>
        {/* Clasp pin */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, bandW * 0.68, 12]} />
          <meshStandardMaterial color="#555" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* Lug connectors */}
      {([-1, 1] as const).map(side => (
        <group key={side}>
          {/* Upper lug */}
          <group position={[side * pW * 0.36, pH / 2 - 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, pW * 0.18, 12]} />
              <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness} />
            </mesh>
          </group>
          {/* Lower lug */}
          <group position={[side * pW * 0.36, -pH / 2 + 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, pW * 0.18, 12]} />
              <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Case body */}
      <RoundedBox args={[pW, pH, pD]} radius={br} smoothness={10} castShadow receiveShadow>
        <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness} envMapIntensity={2.0} />
      </RoundedBox>

      {/* Case edge ring (slight highlight) */}
      <mesh position={[0, 0, pD / 2 - 0.002]}>
        <ringGeometry args={[Math.min(pW, pH) / 2 * 0.88, Math.min(pW, pH) / 2 * 0.97, 40]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.04} roughness={0} metalness={0} />
      </mesh>

      {/* Screen black base */}
      <mesh position={[0, 0, sZ - 0.001]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#050510" roughness={0.06} metalness={0} />
      </mesh>
      {/* Screen content */}
      <group position={[0, 0, sZ + 0.001]}>
        <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
      </group>
      {/* Glass gloss */}
      <mesh position={[0, 0, sZ + 0.003]}>
        <planeGeometry args={[sW * 1.02, sH * 1.02]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.025} roughness={0} metalness={0} />
      </mesh>

      {/* Digital Crown */}
      <group position={[pW / 2 + 0.024, pH * 0.12, 0]}>
        {/* Crown cylinder with grip grooves */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.036, 0.036, 0.044, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness + 0.08} />
        </mesh>
        {/* Crown grip rings */}
        {[-0.012, 0, 0.012].map((dz, i) => (
          <mesh key={i} position={[0.001, 0, dz]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.036, 0.003, 6, 24]} />
            <meshStandardMaterial color={bodyColor} metalness={metalness + 0.05} roughness={roughness - 0.02} />
          </mesh>
        ))}
        {/* Red Ultra ring */}
        {isUltra && (
          <mesh position={[0.001, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.036, 0.003, 4, 24]} />
            <meshStandardMaterial color="#f97316" emissive="#c04000" emissiveIntensity={0.1} roughness={0.4} metalness={0.3} />
          </mesh>
        )}
      </group>

      {/* Side button */}
      <group position={[pW / 2 + 0.016, -pH * 0.12, 0]}>
        <RoundedBox args={[0.032, pH * 0.14, pD * 0.7]} radius={0.007} smoothness={3}>
          <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness + 0.10} />
        </RoundedBox>
      </group>

      {/* Ultra: Action button (orange) */}
      {isUltra && (
        <group position={[-pW / 2 - 0.016, pH * 0.08, 0]}>
          <RoundedBox args={[0.032, pH * 0.10, pD * 0.7]} radius={0.007} smoothness={3}>
            <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.4} emissive="#7c2d12" emissiveIntensity={0.1} />
          </RoundedBox>
        </group>
      )}

      {/* Back: optical heart rate sensor (raised rectangle) */}
      <group position={[0, 0, -pD / 2 - 0.001]}>
        <RoundedBox args={[pW * 0.55, pH * 0.40, 0.012]} radius={0.025} smoothness={4}>
          <meshStandardMaterial color="#1a1a22" roughness={0.4} metalness={0.5} />
        </RoundedBox>
        {/* Sensor emitters (4 green LEDs) */}
        {[[-0.04, 0.04], [0.04, 0.04], [-0.04, -0.04], [0.04, -0.04]].map(([dx, dy], i) => (
          <mesh key={i} position={[dx, dy, 0.007]}>
            <circleGeometry args={[0.012, 12]} />
            <meshStandardMaterial color="#004400" emissive="#00aa44" emissiveIntensity={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
