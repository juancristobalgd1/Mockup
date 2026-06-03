import React, { useEffect, useRef, useState, useCallback } from 'react';

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface VideoControlsProps {
  videoEl: HTMLVideoElement | null;
}

export function VideoControls({ videoEl }: VideoControlsProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loop, setLoop] = useState(true);
  const seekingRef = useRef(false);

  useEffect(() => {
    if (!videoEl) {
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (!seekingRef.current) setCurrentTime(videoEl.currentTime);
    };
    const onLoaded = () => {
      setDuration(videoEl.duration);
      setCurrentTime(videoEl.currentTime);
    };
    const onVolumeChange = () => setMuted(videoEl.muted);

    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('timeupdate', onTimeUpdate);
    videoEl.addEventListener('durationchange', onLoaded);
    videoEl.addEventListener('loadedmetadata', onLoaded);
    videoEl.addEventListener('volumechange', onVolumeChange);

    // Sync initial state
    setPlaying(!videoEl.paused);
    setCurrentTime(videoEl.currentTime);
    setDuration(isFinite(videoEl.duration) ? videoEl.duration : 0);
    setMuted(videoEl.muted);
    setLoop(videoEl.loop);

    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.removeEventListener('durationchange', onLoaded);
      videoEl.removeEventListener('loadedmetadata', onLoaded);
      videoEl.removeEventListener('volumechange', onVolumeChange);
    };
  }, [videoEl]);

  const togglePlay = useCallback(() => {
    if (!videoEl) return;
    if (videoEl.paused) videoEl.play().catch(() => {});
    else videoEl.pause();
  }, [videoEl]);

  const toggleMute = useCallback(() => {
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
  }, [videoEl]);

  const toggleLoop = useCallback(() => {
    if (!videoEl) return;
    videoEl.loop = !videoEl.loop;
    setLoop(videoEl.loop);
  }, [videoEl]);

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoEl) return;
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    videoEl.currentTime = t;
  }, [videoEl]);

  if (!videoEl) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1.25em',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '0.55em',
        padding: '0.45em 0.9em',
        borderRadius: '3em',
        background: 'rgba(10,11,16,0.88)',
        border: '1px solid rgba(255,255,255,0.13)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
      }}
    >
      {/* Play / Pause */}
      <button onClick={togglePlay} title={playing ? 'Pause' : 'Play'} style={iconBtn}>
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <rect x="5" y="3" width="5" height="18" rx="1.5" fill="white" />
            <rect x="14" y="3" width="5" height="18" rx="1.5" fill="white" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <polygon points="6,3 20,12 6,21" fill="white" />
          </svg>
        )}
      </button>

      {/* Current time */}
      <span style={timeLabel}>{formatTime(currentTime)}</span>

      {/* Seek track */}
      <div style={{ position: 'relative', width: 110, height: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {/* Track bg */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'rgba(255,255,255,0.82)', borderRadius: 2 }} />
        </div>
        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.033}
          value={currentTime}
          onChange={handleSeekChange}
          onMouseDown={() => { seekingRef.current = true; }}
          onMouseUp={() => { seekingRef.current = false; }}
          onTouchStart={() => { seekingRef.current = true; }}
          onTouchEnd={() => { seekingRef.current = false; }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
      </div>

      {/* Duration */}
      <span style={{ ...timeLabel, color: 'rgba(255,255,255,0.32)' }}>{formatTime(duration)}</span>

      {/* Loop toggle */}
      <button
        onClick={toggleLoop}
        title={loop ? 'Loop: On' : 'Loop: Off'}
        style={{ ...iconBtn, opacity: loop ? 1 : 0.3 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </button>

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute' : 'Mute'}
        style={{ ...iconBtn, opacity: muted ? 0.35 : 1 }}
      >
        {muted ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="white" strokeWidth="1" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="white" strokeWidth="1" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.3em',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  lineHeight: 0,
  transition: 'opacity 0.15s',
};

const timeLabel: React.CSSProperties = {
  fontSize: '0.72em',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.52)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.02em',
  minWidth: '2.5em',
  textAlign: 'center',
};
