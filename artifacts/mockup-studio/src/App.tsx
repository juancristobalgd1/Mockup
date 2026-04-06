import { useRef } from 'react';
import { AppProvider, useApp } from './store';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { RightPanel } from './components/panels/RightPanel';

function Editor() {
  const { state, updateText, removeText } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#080c18' }}
    >
      <LeftPanel />

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{
            background: 'rgba(10,12,22,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: state.animation !== 'none' ? '#22c55e' : '#4b5563' }}
            />
            <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
              {state.animation !== 'none'
                ? `Animated: ${state.animation}`
                : 'Static'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#4b5563' }}>
              {state.deviceType === 'iphone' && 'iPhone 15 Pro'}
              {state.deviceType === 'android' && 'Android Phone'}
              {state.deviceType === 'ipad' && 'iPad'}
              {state.deviceType === 'macbook' && 'MacBook'}
              {state.deviceType === 'browser' && 'Browser'}
              {state.deviceType === 'watch' && 'Apple Watch'}
              {state.deviceType !== 'browser' && state.deviceType !== 'watch'
                && ` — ${state.deviceLandscape ? 'Landscape' : 'Portrait'}`}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <Canvas
            ref={canvasRef}
            textOverlays={state.texts}
            onUpdateText={updateText}
          />
        </div>
      </div>

      <RightPanel
        canvasRef={canvasRef}
        textOverlays={state.texts}
        onUpdateText={updateText}
        onRemoveText={removeText}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Editor />
    </AppProvider>
  );
}
