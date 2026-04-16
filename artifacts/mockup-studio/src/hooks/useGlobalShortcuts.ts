import { useEffect } from 'react';

interface ShortcutsProps {
  undo: () => void;
  redo: () => void;
  showGrid: boolean;
  updateState: (state: any) => void;
}

export function useGlobalShortcuts({ undo, redo, showGrid, updateState }: ShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isEditing) return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (key === "z" && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (key === "y") {
          e.preventDefault();
          redo();
        }
      } else {
        if (key === "g") {
          e.preventDefault();
          updateState({ showGrid: !showGrid });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, showGrid, updateState]);
}
