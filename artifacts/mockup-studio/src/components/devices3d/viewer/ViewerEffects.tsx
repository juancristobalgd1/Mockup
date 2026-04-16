import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useApp } from "../../../store";

// ── Floor reflector (Rotato-style mirror floor) ───────────────────
export function FloorReflector({ isLaptop }: { isLaptop: boolean }) {
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
export function ClayOverride({
  enabled,
  color,
}: {
  enabled: boolean;
  color: string;
}) {
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
