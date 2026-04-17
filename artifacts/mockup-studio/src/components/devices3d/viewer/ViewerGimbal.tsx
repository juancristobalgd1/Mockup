import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas as R3FCanvas, useFrame } from "@react-three/fiber";
import { useApp } from "../../../store";

export function OrientationGimbal({
  mainCamera,
}: {
  mainCamera: THREE.Camera | null;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        width: 64,
        height: 64,
        pointerEvents: "auto",
        zIndex: 100,
        cursor: "default",
      }}
    >
      <R3FCanvas
        camera={{ position: [0, 0, 5], fov: 26 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={2.5} />
        <pointLight position={[5, 5, 5]} intensity={2} />

        {/* Professional Spline-style circular background - now transparent */}
        <mesh raycast={() => null}>
          <circleGeometry args={[1.5, 40]} />
          <meshBasicMaterial color="#ffffff" opacity={0} transparent />
        </mesh>
        {/* Soft outer border ring - now transparent */}
        <mesh position={[0, 0, -0.05]} raycast={() => null}>
          <circleGeometry args={[1.54, 40]} />
          <meshBasicMaterial color="#e2e8f0" opacity={0} transparent />
        </mesh>
        {/* Depth shadow for the pill - now transparent */}
        <mesh position={[0, 0, -0.1]} raycast={() => null}>
          <circleGeometry args={[1.58, 40]} />
          <meshBasicMaterial color="#000" opacity={0} transparent />
        </mesh>

        <GimbalContent mainCamera={mainCamera} />
      </R3FCanvas>
    </div>
  );
}

function GimbalContent({ mainCamera }: { mainCamera: THREE.Camera | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const { updateState } = useApp();

  useFrame(() => {
    if (groupRef.current && mainCamera) {
      // Sync gimbal orientation with main camera
      groupRef.current.quaternion.copy(mainCamera.quaternion).invert();
    }
  });

  const axisLength = 0.95;
  const axes = [
    {
      dir: new THREE.Vector3(1, 0, 0),
      color: "#ff5f5e",
      label: "X",
      angle: "side",
    },
    {
      dir: new THREE.Vector3(0, 1, 0),
      color: "#2dd4bf",
      label: "Y",
      angle: "top",
    },
    {
      dir: new THREE.Vector3(0, 0, 1),
      color: "#60a5fa",
      label: "Z",
      angle: "front",
    },
    {
      dir: new THREE.Vector3(-1, 0, 0),
      color: "#cbd5e1",
      label: "",
      angle: "left",
    },
    {
      dir: new THREE.Vector3(0, -1, 0),
      color: "#cbd5e1",
      label: "",
      angle: "bottom",
    },
    {
      dir: new THREE.Vector3(0, 0, -1),
      color: "#cbd5e1",
      label: "",
      angle: "back",
    },
  ];

  return (
    <group ref={groupRef}>
      {/* Central anchor point (Blue-Grey) */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.2} roughness={0.4} />
      </mesh>

      {axes.map((axis, i) => (
        <group key={i}>
          <mesh
            position={axis.dir.clone().multiplyScalar(axisLength)}
            onClick={(e) => {
              e.stopPropagation();
              updateState({ cameraAngle: axis.angle as any });
            }}
            onPointerOver={(e) => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              document.body.style.cursor = "default";
            }}
          >
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshStandardMaterial
              color={axis.color}
              emissive={axis.color}
              emissiveIntensity={0.15}
            />
          </mesh>
          <mesh
            position={axis.dir.clone().multiplyScalar(axisLength / 2)}
            quaternion={new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              axis.dir,
            )}
            raycast={() => null}
          >
            <cylinderGeometry args={[0.015, 0.015, axisLength, 8]} />
            <meshBasicMaterial
              color={i < 3 ? axis.color : "#cbd5e1"}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
