import type { CameraKeyframe } from '../../store';
import { useApp } from '../../store';
import { MIN_SEGMENT_DURATION, type TimelineScene } from './timelineUtils';
import type { SegmentDrag } from './useTimelineDrags';

// The camera row: one draggable, resizable bar per scene with keyframe handles.
export function CameraTrack({
  scenes, timelineKeyframes, activeAreaPx, effectivePxPerSec, isDraggingDuration,
  activeKfId, setActiveKfId, currentTime, isPlaying, segmentDrag,
}: {
  scenes: TimelineScene[];
  timelineKeyframes: CameraKeyframe[];
  activeAreaPx: number;
  effectivePxPerSec: number;
  isDraggingDuration: boolean;
  activeKfId: string | null;
  setActiveKfId: (id: string | null) => void;
  currentTime: number;
  isPlaying: boolean;
  segmentDrag: SegmentDrag;
}) {
  const { removeCameraKeyframe } = useApp();

  return (
    <div style={{ height: 44, position: 'relative', width: '100%' }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: activeAreaPx,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)', borderRadius: 4,
        transition: isDraggingDuration ? 'none' : 'width 0.15s ease',
      }}>
        <span style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none',
        }}>Cámara</span>

        {scenes.map(scene => {
          const leftPx = scene.start.time * effectivePxPerSec;
          const widthPx = Math.max((scene.end.time - scene.start.time) * effectivePxPerSec, 18);
          const isActive = scene.keyframes.some(kf => kf.id === activeKfId);

          return (
            <div
              key={`${scene.start.id}-${scene.end.id}-${scene.index}`}
              style={{
                position: 'absolute',
                left: leftPx,
                top: '50%',
                width: widthPx,
                height: 24,
                transform: 'translateY(-50%)',
                zIndex: isActive ? 3 : 2,
              }}
            >
              <div
                onPointerDown={e => segmentDrag.start(e, scene.startIndex, scene.endIndex, 'move')}
                onPointerMove={segmentDrag.move}
                onPointerUp={segmentDrag.finish}
                onPointerCancel={segmentDrag.finish}
                onClick={e => {
                  e.stopPropagation();
                  setActiveKfId(scene.end.id);
                }}
                style={{
                  position: 'absolute',
                  left: 9,
                  right: 9,
                  top: 0,
                  bottom: 0,
                  borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.65)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.18)' : 'none',
                  cursor: 'grab',
                }}
              >
                <span style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 9,
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.34)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pointerEvents: 'none',
                }}>{scene.label}</span>

                {scene.keyframes.length > 2 && scene.keyframes.slice(1, -1).map(innerKf => {
                  const progress = (innerKf.time - scene.start.time) / Math.max(scene.end.time - scene.start.time, MIN_SEGMENT_DURATION);
                  const passed = currentTime >= innerKf.time;
                  return (
                    <div
                      key={innerKf.id}
                      style={{
                        position: 'absolute',
                        left: `${Math.max(0, Math.min(100, progress * 100))}%`,
                        top: '50%',
                        width: 6,
                        height: 6,
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        borderRadius: 1,
                        background: activeKfId === innerKf.id ? '#93c5fd' : passed ? '#fbbf24' : 'rgba(255,255,255,0.48)',
                        boxShadow: activeKfId === innerKf.id ? '0 0 0 2px rgba(59,130,246,0.16)' : passed ? '0 0 6px rgba(251,191,36,0.5)' : 'none',
                        pointerEvents: 'none',
                        transition: 'background 0.2s, box-shadow 0.2s',
                        animation: passed && isPlaying ? 'kf-pulse 0.35s ease-out' : 'none',
                      }}
                    />
                  );
                })}
              </div>

              <div
                onPointerDown={e => {
                  setActiveKfId(scene.start.id);
                  segmentDrag.start(e, scene.startIndex, scene.endIndex, 'resize-start');
                }}
                onPointerMove={segmentDrag.move}
                onPointerUp={segmentDrag.finish}
                onPointerCancel={segmentDrag.finish}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(scene.start.id); if (activeKfId === scene.start.id) setActiveKfId(null); }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: 18,
                  height: 18,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'ew-resize',
                  touchAction: 'none',
                }}
              >
                <div style={{
                  width: 12,
                  height: 12,
                  transform: 'rotate(45deg)',
                  borderRadius: 2,
                  background: activeKfId === scene.start.id ? '#3b82f6' : currentTime >= scene.start.time ? '#fbbf24' : '#d1d5db',
                  boxShadow: activeKfId === scene.start.id ? '0 0 0 3px rgba(59,130,246,0.18)' : currentTime >= scene.start.time ? '0 0 6px rgba(251,191,36,0.5)' : '0 0 0 1px rgba(0,0,0,0.15)',
                  transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                  animation: currentTime >= scene.start.time && isPlaying ? 'kf-pulse-plain 0.35s ease-out' : 'none',
                }} />
              </div>

              <div
                onPointerDown={e => {
                  setActiveKfId(scene.end.id);
                  segmentDrag.start(e, scene.startIndex, scene.endIndex, 'resize-end');
                }}
                onPointerMove={segmentDrag.move}
                onPointerUp={segmentDrag.finish}
                onPointerCancel={segmentDrag.finish}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(scene.end.id); if (activeKfId === scene.end.id) setActiveKfId(null); }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  width: 18,
                  height: 18,
                  transform: 'translate(50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'ew-resize',
                  touchAction: 'none',
                }}
              >
                <div style={{
                  width: 12,
                  height: 12,
                  transform: 'rotate(45deg)',
                  borderRadius: 2,
                  background: activeKfId === scene.end.id ? '#3b82f6' : currentTime >= scene.end.time ? '#fbbf24' : '#d1d5db',
                  boxShadow: activeKfId === scene.end.id ? '0 0 0 3px rgba(59,130,246,0.18)' : currentTime >= scene.end.time ? '0 0 6px rgba(251,191,36,0.5)' : '0 0 0 1px rgba(0,0,0,0.15)',
                  transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                  animation: currentTime >= scene.end.time && isPlaying ? 'kf-pulse-plain 0.35s ease-out' : 'none',
                }} />
              </div>
            </div>
          );
        })}

        {timelineKeyframes.length === 1 && (
          <div
            style={{
              position: 'absolute',
              left: timelineKeyframes[0].time * effectivePxPerSec,
              top: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 2,
            }}
            onClick={e => { e.stopPropagation(); setActiveKfId(timelineKeyframes[0].id === activeKfId ? null : timelineKeyframes[0].id); }}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(timelineKeyframes[0].id); if (activeKfId === timelineKeyframes[0].id) setActiveKfId(null); }}
          >
            <Diamond active={timelineKeyframes[0].id === activeKfId} label={timelineKeyframes[0].label} />
          </div>
        )}
      </div>
    </div>
  );
}

function Diamond({ active, label, onClick, onContextMenu }: {
  active?: boolean;
  label?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {label && (
        <span style={{
          fontSize: 8, color: active ? '#93c5fd' : 'rgba(255,255,255,0.4)',
          maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1, marginBottom: 1,
        }}>{label}</span>
      )}
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        title="Clic: editar · Clic derecho: eliminar"
        style={{
          width: 10, height: 10,
          background: active ? '#3b82f6' : '#94a3b8',
          transform: 'rotate(45deg)',
          cursor: 'pointer', flexShrink: 0, borderRadius: 1,
          transition: 'background 0.15s',
          boxShadow: active ? '0 0 6px rgba(59,130,246,0.7)' : undefined,
        }}
      />
    </div>
  );
}
