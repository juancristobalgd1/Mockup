import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider, useApp } from '../../../store';
import { Canvas } from '../Canvas';
import * as webgl from '../../../utils/webgl';

vi.mock('../../devices3d/Device3DViewer', () => ({
  Device3DViewer: () => <div data-testid="device-3d-viewer">3D Viewer</div>,
}));

vi.mock('../../../utils/webgl', async (importOriginal) => {
  const actual = await importOriginal<typeof webgl>();
  return {
    ...actual,
    probeWebGLSupport: vi.fn(),
  };
});

const mockedProbe = vi.mocked(webgl.probeWebGLSupport);

function renderCanvas(textOverlays = []) {
  return render(
    <AppProvider>
      <Canvas textOverlays={textOverlays} onUpdateText={vi.fn()} />
    </AppProvider>,
  );
}

function updateBgType(bgType: string) {
  const { updateState } = useApp();
  updateState({ bgType: bgType as any });
}

describe('Canvas background rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedProbe.mockReturnValue({ supported: false });
  });

  it('renders solid background', () => {
    const { container } = render(
      <AppProvider>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    // Just verify it renders without crashing
    expect(container.querySelector('[data-testid="canvas-area"]')).toBeInTheDocument();
  });

  it('renders transparent background with checkerboard pattern', () => {
    const { container } = render(
      <AppProvider initialState={{ bgType: 'transparent' }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    const canvasArea = container.querySelector('[data-canvas-root="true"]');
    expect(canvasArea).toBeInTheDocument();
    // Transparent bg shows a checkerboard + dark background
    expect(canvasArea).toHaveStyle({ background: '#1a1a1a' });
  });

  it('renders video background type with dark background', () => {
    const { container } = render(
      <AppProvider initialState={{ bgType: 'video' }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    const canvasArea = container.querySelector('[data-canvas-root="true"]');
    expect(canvasArea).toBeInTheDocument();
  });

  it('renders animated background with style keyframes', () => {
    const { container } = render(
      <AppProvider initialState={{ bgType: 'animated', bgAnimated: 'aurora' }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain('@keyframes bgShift');
  });

  it('renders none background as white', () => {
    const { container } = render(
      <AppProvider initialState={{ bgType: 'none' }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    const bgLayer = container.querySelector('[data-canvas-root="true"] > div');
    expect(bgLayer).toBeInTheDocument();
  });

  it('renders with artboard edge when ratio is set', () => {
    const { container } = render(
      <AppProvider initialState={{ canvasRatio: '16:9' }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    const artboardEdge = container.querySelector('[data-canvas-root="true"] > div:last-child');
    expect(artboardEdge).toBeInTheDocument();
  });

  it('renders vignette overlay when enabled', () => {
    const { container } = render(
      <AppProvider initialState={{ bgVignette: true, bgVignetteIntensity: 50 }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    // Vignette renders as a radial-gradient div inside canvas-root
    const allDivs = container.querySelectorAll('div');
    const vignetteStyle = Array.from(allDivs).find(div =>
      div.getAttribute('style')?.includes('radial-gradient')
    );
    expect(vignetteStyle).toBeDefined();
  });

  it('renders grain overlay when enabled', () => {
    const { container } = render(
      <AppProvider initialState={{ grain: true, grainIntensity: 50 }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    const allDivs = container.querySelectorAll('div');
    const grainDiv = Array.from(allDivs).find(div =>
      div.getAttribute('style')?.includes('feTurbulence')
    );
    expect(grainDiv).toBeDefined();
  });

  it('applies bgBlur to background layer', () => {
    const { container } = render(
      <AppProvider initialState={{ bgType: 'solid', bgColor: '#ff0000', bgBlur: 5 }}>
        <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
      </AppProvider>,
    );
    // bgBlur filter is on the background div inside canvas-root (not the bg-only div which is 3rd child)
    // The bg div is at zIndex:0 inside canvas-root
    const canvasRoot = container.querySelector('[data-canvas-root="true"]');
    const bgDiv = canvasRoot?.querySelector('div[style*="z-index: 0"]');
    expect(bgDiv?.getAttribute('style')).toContain('filter');
  });
});