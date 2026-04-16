import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { getGlobalScreenTexture } from "../textureGlobal";

// ── Browser: screen content mesh (texture updated every frame) ────
export function BrowserScreenContent({
  w,
  h,
  contentType,
}: {
  w: number;
  h: number;
  contentType: "image" | "video" | null;
}) {
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#070b14", toneMapped: false }),
    [],
  );
  useEffect(
    () => () => {
      mat.dispose();
    },
    [mat],
  );
  const ctRef = useRef(contentType);
  ctRef.current = contentType;
  useFrame(() => {
    const tex = getGlobalScreenTexture();
    if (tex) {
      const needMap = mat.map !== tex;
      const needColor = mat.color.r < 0.99;
      if (needMap || needColor) {
        if (needMap) mat.map = tex;
        if (needColor) mat.color.set("#ffffff");
        mat.needsUpdate = true;
      }
      if (ctRef.current === "video") tex.needsUpdate = true;
    } else if (mat.map || mat.color.r > 0.04) {
      mat.map = null;
      mat.color.set("#070b14");
      mat.needsUpdate = true;
    }
  });
  return (
    <mesh material={mat} renderOrder={1}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

// ── Browser window — full 3D model with chrome UI + live screen ───
export function BrowserFrame3D({
  contentType,
  browserMode,
}: {
  contentType: "image" | "video" | null;
  browserMode: "dark" | "light";
}) {
  const isDark = browserMode !== "light";

  // Colours
  const frameColor = isDark ? "#1a1a1e" : "#ebebed";
  const barColor = isDark ? "#2c2c2e" : "#e2e2e4";
  const tabColor = isDark ? "#3a3a3c" : "#d0d0d2";
  const addrColor = isDark ? "#424244" : "#c8c8ca";
  const iconColor = isDark ? "#8e8e93" : "#7a7a80";

  // World dimensions (W×H browser window)
  const W = 3.4,
    H = 2.2,
    D = 0.07;
  const barH = 0.3; // chrome bar height
  const barY = H / 2 - barH / 2; // center of bar
  const contH = H - barH; // content area height
  const contY = barY - barH / 2 - contH / 2; // center of content

  // Tab strip occupies top 40% of bar, nav row the rest
  const tabH = barH * 0.4;
  const tabY = barY + (barH - tabH) / 2; // top of bar zone

  return (
    <group>
      {/* ── Frame body ─────────────────────────────────────────────── */}
      <RoundedBox
        args={[W, H, D]}
        radius={0.09}
        smoothness={6}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={frameColor}
          metalness={0.18}
          roughness={0.16}
          envMapIntensity={1.2}
          clearcoat={0.6}
          clearcoatRoughness={0.08}
        />
      </RoundedBox>

      {/* ── Chrome bar background ────────────────────────────────── */}
      <mesh position={[0, barY, D / 2 + 0.0005]}>
        <planeGeometry args={[W - 0.004, barH]} />
        <meshBasicMaterial color={barColor} />
      </mesh>

      {/* ── Divider line between bar and content ─────────────────── */}
      <mesh position={[0, barY - barH / 2 + 0.002, D / 2 + 0.001]}>
        <planeGeometry args={[W - 0.004, 0.005]} />
        <meshBasicMaterial color={isDark ? "#000000" : "#b0b0b2"} />
      </mesh>

      {/* ── Tab strip ────────────────────────────────────────────── */}
      <mesh position={[-W / 2 + 0.5, tabY, D / 2 + 0.002]}>
        <planeGeometry args={[0.8, tabH - 0.02]} />
        <meshBasicMaterial color={barColor} />
      </mesh>
      {[0, 0.08, 0.16].map((ox) => (
        <mesh key={ox} position={[-W / 2 + 0.26 + ox, tabY, D / 2 + 0.004]}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshBasicMaterial color={iconColor} />
        </mesh>
      ))}
      <mesh position={[-W / 2 + 0.84, tabY, D / 2 + 0.004]}>
        <circleGeometry args={[0.022, 16]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      <mesh position={[-W / 2 + 0.98, tabY, D / 2 + 0.003]}>
        <planeGeometry args={[0.055, 0.055]} />
        <meshBasicMaterial color={tabColor} />
      </mesh>

      {/* ── Traffic lights ────────────────────────────────────────── */}
      {[
        { x: -W / 2 + 0.13, col: "#ff5f57" }, // close
        { x: -W / 2 + 0.18, col: "#febc2e" }, // minimize
        { x: -W / 2 + 0.23, col: "#28c841" }, // maximize
      ].map((dot, i) => (
        <mesh key={i} position={[dot.x, barY + 0.08, D / 2 + 0.004]}>
          <circleGeometry args={[0.015, 16]} />
          <meshBasicMaterial color={dot.col} />
        </mesh>
      ))}

      {/* ── Navbar area ───────────────────────────────────────────── */}
      {/* Address bar */}
      <RoundedBox
        args={[W - 0.9, 0.11, 0.001]}
        radius={0.03}
        position={[0.15, barY - 0.06, D / 2 + 0.003]}
      >
        <meshBasicMaterial color={addrColor} />
      </RoundedBox>
      {/* Search dots */}
      {[0, 0.05, 0.1].map((ox) => (
        <mesh
          key={ox}
          position={[-W / 2 + 0.65 + ox, barY - 0.06, D / 2 + 0.005]}
        >
          <planeGeometry args={[0.035, 0.005]} />
          <meshBasicMaterial color={iconColor} />
        </mesh>
      ))}

      {/* ── Screen content ───────────────────────────────────────── */}
      <group position={[0, contY, D / 2 + 0.001]}>
        <BrowserScreenContent w={W - 0.004} h={contH} contentType={contentType} />
      </group>
    </group>
  );
}
