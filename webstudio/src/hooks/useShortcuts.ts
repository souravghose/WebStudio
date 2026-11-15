import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { exportProject, formatActive, runPreview, saveProject } from '../lib/actions';

/**
 * Global shortcuts for when focus is outside Monaco. Inside the editor the same commands are
 * registered with editor.addCommand (see EditorArea), which preventDefault()s the event first,
 * so the `defaultPrevented` check below stops them from firing twice.
 * Native editing shortcuts (Ctrl+Z/Y/F/H) are deliberately left to Monaco.
 */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const st = useStore.getState();

      if (mod && !e.shiftKey && !e.altKey && key === 's') {
        e.preventDefault();
        void saveProject();
      } else if (mod && e.shiftKey && key === 's') {
        e.preventDefault();
        void exportProject();
      } else if (mod && e.shiftKey && key === 'f') {
        e.preventDefault();
        st.focusSearch();
      } else if (e.altKey && e.shiftKey && key === 'f') {
        e.preventDefault();
        void formatActive();
      } else if (mod && key === 'enter') {
        e.preventDefault();
        runPreview();
      } else if (mod && !e.shiftKey && key === 'b') {
        e.preventDefault();
        st.toggleSidebar();
      } else if (mod && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        st.toggleBottom();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Ctrl + S', action: 'Save project' },
  { keys: 'Ctrl + Shift + S', action: 'Export project as ZIP' },
  { keys: 'Ctrl + Z', action: 'Undo' },
  { keys: 'Ctrl + Y', action: 'Redo' },
  { keys: 'Ctrl + F', action: 'Find in file' },
  { keys: 'Ctrl + H', action: 'Replace in file' },
  { keys: 'Ctrl + Shift + F', action: 'Search across files' },
  { keys: 'Alt + Shift + F', action: 'Format document (Prettier)' },
  { keys: 'Ctrl + Enter', action: 'Run / refresh preview' },
  { keys: 'Ctrl + B', action: 'Toggle sidebar' },
  { keys: 'Ctrl + `', action: 'Toggle bottom panel' },
  { keys: 'Ctrl + Wheel', action: 'Zoom editor text' },
  { keys: 'F2', action: 'Rename selected file (Explorer)' },
];
