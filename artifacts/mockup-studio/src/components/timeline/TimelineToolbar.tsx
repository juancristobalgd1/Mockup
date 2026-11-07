import { Play, Pause, Trash2, Circle, X, Square, ChevronDown, ChevronUp, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '../../store';
import { TIMELINE_BG, formatTime, formatTimer } from './timelineUtils';
import { TimelineOptionsMenu } from './TimelineOptionsMenu';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

// One-line bar shown while the editor is minimized.
export function TimelineCollapsedStrip({
  keyframeCount, isPlaying, liveRecording, currentTime, displayDuration, onTogglePlayback, onExpand,
}: {
  keyframeCount: number;
  isPlaying: boolean;
  liveRecording: boolean;
  currentTime: number;
  displayDuration: number;
  onTogglePlayback: () => void;
  onExpand: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 14px',
      background: `linear-gradient(90deg, ${TIMELINE_BG}, rgba(255,255,255,0.03) 60%, ${TIMELINE_BG})`,
    }}>
      <button
        onClick={onTogglePlayback}
        disabled={liveRecording}
        style={{
          background: isPlaying ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 5, width: 24, height: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
        }}
      >
        {isPlaying ? <Pause size={10} /> : <Play size={10} />}
      </button>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
        {formatTime(currentTime)} / {displayDuration}s
      </span>
      {keyframeCount > 0 && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          · {keyframeCount} keyframes
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button
        onClick={onExpand}
        title="Expandir editor"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, padding: '2px 6px',
        }}
      >
        <ChevronUp size={13} />
        <span>Expandir</span>
      </button>
    </div>
  );
}

// Transport, recording and option controls (row 1) plus time, curve and zoom (row 2).
export function TimelineToolbar({
  keyframeCount, isPlaying, liveRecording, liveTime, currentTime, displayDuration, isDraggingDuration,
  timelineZoom, setTimelineZoom, onTogglePlayback, onStop, onStartRecording, onStopRecording,
  onClearKeyframes, onApplyPreset, onApplyTemplate, onCollapse, onClose,
}: {
  keyframeCount: number;
  isPlaying: boolean;
  liveRecording: boolean;
  liveTime: number;
  currentTime: number;
  displayDuration: number;
  isDraggingDuration: boolean;
  timelineZoom: number;
  setTimelineZoom: React.Dispatch<React.SetStateAction<number>>;
  onTogglePlayback: () => void;
  onStop: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearKeyframes: () => void;
  onApplyPreset: (presetId: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onCollapse: () => void;
  onClose: () => void;
}) {
  const { state, updateState } = useApp();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 0,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
    {/* Row 1: playback + keyframe controls */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 6px', flexWrap: 'wrap' }}>

      {/* Play / Pause */}
      {(() => {
        const noScene = keyframeCount < 2;
        const dis = liveRecording || noScene;
        return (
          <button
            onClick={onTogglePlayback}
            disabled={dis}
            title={noScene ? 'Añade al menos 2 keyframes para reproducir' : isPlaying ? 'Pausar' : 'Reproducir animación'}
            style={{
              background: isPlaying ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, width: 28, height: 28,
              cursor: dis ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
              opacity: dis ? 0.3 : 1,
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
        );
      })()}

      {/* Stop — resets playhead to 0 */}
      {(() => {
        const noScene = keyframeCount < 2;
        const dis = liveRecording || noScene;
        return (
          <button
            onClick={onStop}
            disabled={dis}
            title={noScene ? 'Añade al menos 2 keyframes para usar stop' : 'Detener y volver al inicio'}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, width: 28, height: 28,
              cursor: dis ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              opacity: dis ? 0.3 : 1,
            }}
          >
            <Square size={10} />
          </button>
        );
      })()}

      {/* REC / STOP button */}
      {!liveRecording ? (
        <button
          onClick={onStartRecording}
          disabled={isPlaying}
          title="Grabar movimiento del dispositivo como keyframes"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 12px', height: 28, borderRadius: 6, cursor: 'pointer',
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            color: '#f87171', fontSize: 11, fontWeight: 700,
            opacity: isPlaying ? 0.35 : 1,
          }}
        >
          <Circle size={9} fill="#f87171" color="#f87171" />
          GRABAR
        </button>
      ) : (
        <button
          onClick={onStopRecording}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 12px', height: 28, borderRadius: 6, cursor: 'pointer',
            background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(239,68,68,0.6)',
            color: '#fca5a5', fontSize: 11, fontWeight: 700,
          }}
        >
          <Square size={9} fill="#fca5a5" color="#fca5a5" />
          PARAR
        </button>
      )}

      {liveRecording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'recBlink 1s step-start infinite' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#f87171' }}>
            {formatTimer(liveTime)}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            — Mueve el dispositivo con el ratón...
          </span>
        </div>
      )}


      {/* Clear all (Back to main bar as requested) */}
      {keyframeCount > 0 && !liveRecording && (
        <button
          onClick={onClearKeyframes}
          title="Eliminar todos los keyframes"
          style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f87171',
          }}
        >
          <Trash2 size={12} />
        </button>
      )}

      {!liveRecording && (
        <TimelineOptionsMenu onApplyPreset={onApplyPreset} onApplyTemplate={onApplyTemplate} />
      )}


      <div style={{ flex: 1 }} />

      {/* Minimize button */}
      <button
        onClick={onCollapse}
        title="Minimizar editor"
        aria-label="Minimizar editor de video"
        style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 5, width: 26, height: 26, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <ChevronDown size={13} />
      </button>

      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

      <button
        onClick={onClose}
        title="Cerrar editor de video"
        aria-label="Cerrar editor de video"
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: 4,
        }}
      >
        <X size={14} />
      </button>
    </div>

    {/* Row 2: time display + zoom controls */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 14px 6px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
        {formatTime(currentTime)}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>/</span>
      <span
        title="Arrastra el borde derecho del timeline para cambiar la duración"
        style={{
          fontFamily: 'monospace', fontSize: 11,
          color: isDraggingDuration ? '#f97316' : 'rgba(255,255,255,0.45)',
          fontWeight: 600, transition: 'color 0.15s', userSelect: 'none',
        }}
      >
        {displayDuration % 1 === 0 ? `${displayDuration}s` : `${displayDuration.toFixed(1)}s`}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Curva
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round((state.movieCurveTension ?? 0.45) * 100)}
          onChange={e => updateState({ movieCurveTension: Number(e.target.value) / 100 }, true)}
          title="Tensión de curva: menor valor = más fluido, mayor valor = más rígido"
          style={{ width: 88, accentColor: '#a78bfa' }}
        />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', minWidth: 30 }}>
          {Math.round((state.movieCurveTension ?? 0.45) * 100)}%
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Zoom Out */}
      <button
        onClick={() => setTimelineZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
        disabled={timelineZoom <= MIN_ZOOM}
        title="Zoom out de la línea de tiempo"
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 5, width: 22, height: 22, cursor: timelineZoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)', opacity: timelineZoom <= MIN_ZOOM ? 0.35 : 1,
        }}
      >
        <ZoomOut size={11} />
      </button>

      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', minWidth: 26, textAlign: 'center' }}>
        {timelineZoom}×
      </span>

      {/* Zoom In */}
      <button
        onClick={() => setTimelineZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
        disabled={timelineZoom >= MAX_ZOOM}
        title="Zoom in de la línea de tiempo"
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 5, width: 22, height: 22, cursor: timelineZoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)', opacity: timelineZoom >= MAX_ZOOM ? 0.35 : 1,
        }}
      >
        <ZoomIn size={11} />
      </button>
    </div>
    </div>
  );
}
