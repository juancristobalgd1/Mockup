import { useCallback, useEffect, useRef, useState } from 'react';

// Timeline clock: advances movieTimeRef with requestAnimationFrame and loops at the end.
export function useTimelinePlayback({ movieTimeRef, movieDuration, onPlayingChange }: {
  movieTimeRef: React.MutableRefObject<number>;
  movieDuration: number;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const kfRafRef = useRef<number | null>(null);
  const kfLastTsRef = useRef<number | null>(null);
  // Always-current ref so the rAF tick never reads a stale movieDuration closure
  const movieDurationRef = useRef(movieDuration);
  movieDurationRef.current = movieDuration;

  const seek = useCallback((time: number) => {
    movieTimeRef.current = time;
    setCurrentTime(time);
  }, [movieTimeRef]);

  const stopPlayback = useCallback(() => {
    if (kfRafRef.current) { cancelAnimationFrame(kfRafRef.current); kfRafRef.current = null; }
    kfLastTsRef.current = null;
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange]);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    onPlayingChange?.(true);
    kfLastTsRef.current = null;
    const tick = (ts: number) => {
      if (kfLastTsRef.current === null) kfLastTsRef.current = ts;
      const delta = (ts - kfLastTsRef.current) / 1000;
      kfLastTsRef.current = ts;
      // Read through the ref so changes to movieDuration are always respected,
      // even if they happen while this rAF loop is already running.
      const dur = movieDurationRef.current;
      movieTimeRef.current = Math.min(movieTimeRef.current + delta, dur);
      setCurrentTime(movieTimeRef.current);
      if (movieTimeRef.current >= dur) {
        movieTimeRef.current = 0; setCurrentTime(0); kfLastTsRef.current = null;
      }
      kfRafRef.current = requestAnimationFrame(tick);
    };
    kfRafRef.current = requestAnimationFrame(tick);
  }, [movieDurationRef, movieTimeRef, onPlayingChange]);

  useEffect(() => () => {
    if (kfRafRef.current) cancelAnimationFrame(kfRafRef.current);
  }, []);

  return { currentTime, isPlaying, seek, startPlayback, stopPlayback };
}
