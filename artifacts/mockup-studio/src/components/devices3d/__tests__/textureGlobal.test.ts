import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the 'three' module with a minimal THREE.Texture class so we can
// verify pass-by-reference semantics without pulling in the full WebGL stack.
vi.mock('three', () => {
  class FakeTexture {
    constructor(public source: string) {}
  }
  return { Texture: FakeTexture };
});

// Import under test AFTER mocking 'three'.
import * as THREE from 'three';
import {
  setGlobalScreenTexture,
  getGlobalScreenTexture,
  subscribeToScreenTexture,
} from '../textureGlobal';

const makeTex = (label: string) => new THREE.Texture(label) as unknown as THREE.Texture;

describe('textureGlobal singleton', () => {
  beforeEach(() => {
    // Reset shared state by setting to null (no public reset helper).
    setGlobalScreenTexture(null);
  });

  it('starts with no global texture', () => {
    expect(getGlobalScreenTexture()).toBeNull();
  });

  it('setGlobalScreenTexture stores the value readable by getGlobalScreenTexture', () => {
    const tex = makeTex('image-1');
    setGlobalScreenTexture(tex);
    expect(getGlobalScreenTexture()).toBe(tex);
  });

  it('setGlobalScreenTexture(null) clears the current texture', () => {
    const tex = makeTex('image-1');
    setGlobalScreenTexture(tex);
    expect(getGlobalScreenTexture()).toBe(tex);

    setGlobalScreenTexture(null);
    expect(getGlobalScreenTexture()).toBeNull();
  });

  it('notifies every subscriber when the texture changes', () => {
    const a = vi.fn();
    const b = vi.fn();
    subscribeToScreenTexture(a);
    subscribeToScreenTexture(b);

    const tex = makeTex('image-1');
    setGlobalScreenTexture(tex);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('does NOT notify subscribers added between updates of an unchanged value', () => {
    // Important: the singleton should only notify on `set` calls,
    // never on subscription. This guards against an accidental
    // "always-fire on subscribe" regression.
    const fn = vi.fn();
    subscribeToScreenTexture(fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it('returns the same reference for getGlobalScreenTexture (no cloning)', () => {
    const tex = makeTex('shared');
    setGlobalScreenTexture(tex);
    expect(getGlobalScreenTexture()).toBe(tex);
    // Reading again must yield the identical reference.
    expect(getGlobalScreenTexture()).toBe(tex);
  });

  it('unsubscribe stops further notifications', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribeToScreenTexture(a);
    subscribeToScreenTexture(b);

    setGlobalScreenTexture(makeTex('first'));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();

    setGlobalScreenTexture(makeTex('second'));
    // 'a' was unsubscribed — should still be at 1 call.
    expect(a).toHaveBeenCalledTimes(1);
    // 'b' is still subscribed — should have been called again.
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('notifies in subscription order', () => {
    const sequence: string[] = [];
    const unsubA = subscribeToScreenTexture(() => sequence.push('a'));
    const unsubB = subscribeToScreenTexture(() => sequence.push('b'));
    const unsubC = subscribeToScreenTexture(() => sequence.push('c'));

    setGlobalScreenTexture(makeTex('trigger'));
    expect(sequence).toEqual(['a', 'b', 'c']);

    // Clean up so other tests in this suite aren't affected by lingering listeners.
    unsubA();
    unsubB();
    unsubC();
  });

  it('does not throw when there are no subscribers and texture is set', () => {
    // No subscribers registered for this test.
    expect(() => setGlobalScreenTexture(makeTex('orphan'))).not.toThrow();
    expect(getGlobalScreenTexture()).not.toBeNull();
  });
});
