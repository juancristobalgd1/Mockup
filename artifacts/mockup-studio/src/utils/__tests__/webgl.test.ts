import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { probeWebGLSupport, tryCreateWebGLRenderer } from '../webgl';

describe('probeWebGLSupport', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalWebGLRenderingContext = window.WebGLRenderingContext;

  beforeEach(() => {
    Object.defineProperty(window, 'WebGLRenderingContext', {
      configurable: true,
      writable: true,
      value: originalWebGLRenderingContext ?? function WebGLRenderingContext() {},
    });
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    Object.defineProperty(window, 'WebGLRenderingContext', {
      configurable: true,
      writable: true,
      value: originalWebGLRenderingContext,
    });
    vi.restoreAllMocks();
  });

  it('returns unsupported when WebGLRenderingContext is missing', () => {
    Object.defineProperty(window, 'WebGLRenderingContext', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const result = probeWebGLSupport('basic');
    expect(result.supported).toBe(false);
    expect(result.error).toContain('WebGLRenderingContext');
  });

  it('returns supported on basic probe when context works', () => {
    const mockGl = {
      DEPTH_TEST: 1,
      COLOR_BUFFER_BIT: 2,
      DEPTH_BUFFER_BIT: 4,
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      COMPILE_STATUS: 3,
      enable: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      getError: vi.fn(),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      deleteShader: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockGl) as typeof HTMLCanvasElement.prototype.getContext;

    const result = probeWebGLSupport('basic');
    expect(result.supported).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns supported on strict probe even when shader compile fails', () => {
    const mockGl = {
      DEPTH_TEST: 1,
      COLOR_BUFFER_BIT: 2,
      DEPTH_BUFFER_BIT: 4,
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      COMPILE_STATUS: 3,
      enable: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      getError: vi.fn(),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => false),
      deleteShader: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockGl) as typeof HTMLCanvasElement.prototype.getContext;

    const result = probeWebGLSupport('strict');
    expect(result.supported).toBe(true);
    expect(result.shaderCompileOk).toBe(false);
  });

  it('returns unsupported when no context can be created', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as typeof HTMLCanvasElement.prototype.getContext;

    const result = probeWebGLSupport('basic');
    expect(result.supported).toBe(false);
    expect(result.error).toContain('Failed to create WebGL context');
  });
});

describe('tryCreateWebGLRenderer', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalWebGLRenderingContext = window.WebGLRenderingContext;

  beforeEach(() => {
    Object.defineProperty(window, 'WebGLRenderingContext', {
      configurable: true,
      writable: true,
      value: originalWebGLRenderingContext ?? function WebGLRenderingContext() {},
    });
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  it('returns gl when context is available', () => {
    const mockGl = {
      DEPTH_TEST: 1,
      COLOR_BUFFER_BIT: 2,
      DEPTH_BUFFER_BIT: 4,
      enable: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      getError: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockGl) as typeof HTMLCanvasElement.prototype.getContext;

    const { gl, error } = tryCreateWebGLRenderer();
    expect(gl).toBe(mockGl);
    expect(error).toBeUndefined();
  });
});
