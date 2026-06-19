import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { AppProvider, useApp } from '../../../store';
import { CSSDeviceFallback } from '../../devices3d/WebGLFallback';
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

import { Canvas } from '../Canvas';

const mockedProbe = vi.mocked(webgl.probeWebGLSupport);

function renderCanvas() {
  return render(
    <AppProvider>
      <Canvas textOverlays={[]} onUpdateText={vi.fn()} />
    </AppProvider>,
  );
}

function VideoFallback() {
  const { updateState } = useApp();
  useEffect(() => {
    updateState({
      contentType: 'video',
      videoUrl: 'https://example.com/video.mp4',
    });
  }, [updateState]);
  return <CSSDeviceFallback error="test" />;
}

function ImageFallback() {
  const { updateState } = useApp();
  useEffect(() => {
    updateState({
      contentType: 'image',
      screenshotUrl: 'https://example.com/screen.png',
    });
  }, [updateState]);
  return <CSSDeviceFallback error="test" />;
}

describe('Canvas WebGL routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 3D viewer when WebGL probe succeeds', () => {
    mockedProbe.mockReturnValue({ supported: true });

    renderCanvas();

    expect(screen.getByTestId('device-3d-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('css-device-fallback')).not.toBeInTheDocument();
  });

  it('renders CSS fallback when WebGL probe fails', () => {
    mockedProbe.mockReturnValue({ supported: false, error: 'No WebGL' });

    renderCanvas();

    expect(screen.getByTestId('css-device-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('device-3d-viewer')).not.toBeInTheDocument();
  });

  it('re-probes WebGL when user clicks Probar vista 3D', async () => {
    mockedProbe
      .mockReturnValueOnce({ supported: false, error: 'No WebGL' })
      .mockReturnValueOnce({ supported: true });

    renderCanvas();

    expect(screen.getByTestId('try-3d-view-button')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('try-3d-view-button'));
    });

    expect(mockedProbe).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('device-3d-viewer')).toBeInTheDocument();
  });
});

describe('CSSDeviceFallback screen content', () => {
  it('renders video when contentType is video', async () => {
    render(
      <AppProvider>
        <VideoFallback />
      </AppProvider>,
    );

    const video = await screen.findByTestId('css-fallback-screen-video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('renders image background when contentType is image', async () => {
    render(
      <AppProvider>
        <ImageFallback />
      </AppProvider>,
    );

    expect(await screen.findByTestId('css-fallback-screen-image')).toBeInTheDocument();
  });
});
