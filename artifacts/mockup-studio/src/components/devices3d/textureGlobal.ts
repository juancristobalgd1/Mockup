import * as THREE from 'three';

let _tex: THREE.Texture | null = null;
const _listeners: Set<() => void> = new Set();

export function setGlobalScreenTexture(tex: THREE.Texture | null) {
  _tex = tex;
  _listeners.forEach(fn => fn());
}

export function getGlobalScreenTexture(): THREE.Texture | null {
  return _tex;
}

export function subscribeToScreenTexture(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}
