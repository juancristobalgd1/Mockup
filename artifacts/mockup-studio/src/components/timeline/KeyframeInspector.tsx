import { useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { useApp } from '../../store';
import type { CameraKeyframe } from '../../store';
import { EASING_OPTIONS } from './timelineAnimations';
import { formatTime } from './timelineUtils';

// Name, easing, duplicate and delete controls for the selected keyframe.
// Render with key={activeKf.id} so selecting another keyframe resets the name editor.
export function KeyframeInspector({ activeKf, showAddKeyframe, onAddKeyframe, onDuplicate, onDelete }: {
  activeKf: CameraKeyframe;
  showAddKeyframe: boolean;
  onAddKeyframe: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { updateCameraKeyframe } = useApp();
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Keyframe · {formatTime(activeKf.time)}
      </span>

      {/* Label input */}
      {editingLabel !== null ? (
        <input
          autoFocus
          value={editingLabel}
          onChange={e => setEditingLabel(e.target.value)}
          onBlur={() => { updateCameraKeyframe(activeKf.id, { label: editingLabel || undefined }); setEditingLabel(null); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { updateCameraKeyframe(activeKf.id, { label: editingLabel || undefined }); setEditingLabel(null); } }}
          placeholder="Nombre del keyframe…"
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 4, color: '#fff', fontSize: 11, padding: '2px 7px', height: 24,
            outline: 'none', width: 140,
          }}
        />
      ) : (
        <button
          onClick={() => setEditingLabel(activeKf.label ?? '')}
          title="Editar nombre"
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, color: activeKf.label ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
            fontSize: 11, padding: '2px 8px', height: 24, cursor: 'pointer',
          }}
        >
          {activeKf.label || '+ Nombre'}
        </button>
      )}

      {/* New Add Keyframe button location (Groups with Rename) */}
      {showAddKeyframe && (
        <button
          onClick={onAddKeyframe}
          title="Añadir nueva escena/keyframe"
          style={{
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 4, padding: '2px 10px', height: 24, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: '#93c5fd', fontSize: 11, fontWeight: 700,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
        >
          <Plus size={11} />
          Keyframe
        </button>
      )}

      {/* Easing selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Easing:</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {EASING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateCameraKeyframe(activeKf.id, { easing: opt.value })}
              title={opt.desc}
              style={{
                background: (activeKf.easing ?? 'smooth') === opt.value ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${(activeKf.easing ?? 'smooth') === opt.value ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4, padding: '2px 7px', height: 24, cursor: 'pointer',
                color: (activeKf.easing ?? 'smooth') === opt.value ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                fontSize: 10, fontWeight: 600,
                transition: 'all 0.12s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Copy keyframe */}
      <button
        onClick={onDuplicate}
        title="Duplicar keyframe"
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4, width: 24, height: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        <Copy size={11} />
      </button>

      {/* Delete keyframe */}
      <button
        onClick={onDelete}
        title="Eliminar keyframe"
        style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 4, width: 24, height: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#f87171',
        }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
