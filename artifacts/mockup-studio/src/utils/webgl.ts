export type WebGLProbeLevel = 'basic' | 'strict';

export interface WebGLProbeResult {
  supported: boolean;
  error?: string;
  /** Only set when level is `strict`; diagnostic only — does not gate 3D render. */
  shaderCompileOk?: boolean;
}

const CONTEXT_NAMES = ['webgl', 'experimental-webgl', 'webgl2'] as const;

const R3F_CONTEXT_OPTIONS: WebGLContextAttributes = {
  alpha: true,
  antialias: true,
  depth: true,
  preserveDrawingBuffer: true,
  failIfMajorPerformanceCaveat: false,
};

function tryShaderCompile(gl: WebGLRenderingContext): boolean {
  try {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return false;

    gl.shaderSource(vertexShader, 'void main() { gl_Position = vec4(0, 0, 0, 1); }');
    gl.shaderSource(fragmentShader, 'void main() { gl_FragColor = vec4(1, 0, 0, 1); }');
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    const vertexOk = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    const fragmentOk = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return Boolean(vertexOk && fragmentOk);
  } catch {
    return false;
  }
}

function tryCreateContext(
  options: WebGLContextAttributes = R3F_CONTEXT_OPTIONS,
): WebGLRenderingContext | null {
  if (!window.WebGLRenderingContext) return null;

  const canvas = document.createElement('canvas');

  for (const contextName of CONTEXT_NAMES) {
    try {
      const gl = canvas.getContext(contextName, options) as WebGLRenderingContext | null;
      if (!gl) continue;

      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (typeof gl.getError !== 'function') continue;

      return gl;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Probe WebGL support for render decisions or diagnostics.
 * `basic` — context creation + clear (used to decide 3D vs 2D fallback).
 * `strict` — also runs shader compile probe (diagnostic only; does not block 3D).
 */
export function probeWebGLSupport(level: WebGLProbeLevel = 'basic'): WebGLProbeResult {
  try {
    if (!window.WebGLRenderingContext) {
      return { supported: false, error: 'WebGLRenderingContext not available' };
    }

    const gl = tryCreateContext();
    if (!gl) {
      return { supported: false, error: 'Failed to create WebGL context' };
    }

    let result: WebGLProbeResult;
    if (level === 'strict') {
      const shaderCompileOk = tryShaderCompile(gl);
      result = { supported: true, shaderCompileOk };
    } else {
      result = { supported: true };
    }

    try {
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) loseCtx.loseContext();
    } catch {
      // Best-effort cleanup
    }

    return result;
  } catch (e) {
    return {
      supported: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

/** Returns a working WebGL context if one can be created, otherwise null. */
export function tryCreateWebGLRenderer(): { gl: WebGLRenderingContext | null; error?: string } {
  try {
    const gl = tryCreateContext({
      alpha: false,
      antialias: false,
      depth: true,
      failIfMajorPerformanceCaveat: false,
    });

    if (gl) return { gl };

    return { gl: null, error: 'Failed to create a working WebGL renderer' };
  } catch (e) {
    return {
      gl: null,
      error: e instanceof Error ? e.message : 'Unknown error creating WebGL renderer',
    };
  }
}
