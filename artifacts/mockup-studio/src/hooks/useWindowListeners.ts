import { useEffect } from 'react';

interface WindowListenersProps {
  state: any;
  showGlobalMenu: boolean;
  setShowGlobalMenu: (show: boolean) => void;
}

export function useWindowListeners({ state, showGlobalMenu, setShowGlobalMenu }: WindowListenersProps) {
  // Warn before unload when there are unsaved changes
  useEffect(() => {
    const hasContent =
      state.screenshotUrl ||
      state.videoUrl ||
      state.texts.length > 0 ||
      state.annotateStrokes.length > 0;
    if (!hasContent) return;
    
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [
    state.screenshotUrl,
    state.videoUrl,
    state.texts.length,
    state.annotateStrokes.length,
  ]);

  // Close global menu on outside click
  useEffect(() => {
    if (!showGlobalMenu) return;
    const handleClick = () => {
      setShowGlobalMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showGlobalMenu, setShowGlobalMenu]);
}
