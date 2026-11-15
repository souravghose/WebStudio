import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { exportProject, formatActive, runPreview, saveProject } from '../lib/actions';
import { editorBridge } from '../lib/editorBridge';
import { openQuickOpen } from '../lib/quickOpen';

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
      } else if (mod && !e.shiftKey && !e.altKey && key === 'p') {
        e.preventDefault();
        openQuickOpen();
      } else if (mod && e.shiftKey && !e.altKey && key === 'p') {
        e.preventDefault();
        void editorBridge.get()?.getAction('editor.action.quickCommand')?.run();
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
  { keys: 'Tab', action: 'Expand Emmet abbreviation (HTML / CSS)' },
  { keys: 'Ctrl + P', action: 'Go to file' },
  { keys: 'Ctrl + Shift + P', action: 'Command palette' },
  { keys: 'Ctrl + G', action: 'Go to line' },
  { keys: 'Alt + Click', action: 'Add cursor' },
  { keys: 'Ctrl + Alt + ↑ / ↓', action: 'Add cursor above / below' },
  { keys: 'Ctrl + D', action: 'Select next occurrence' },
  { keys: 'Ctrl + Shift + L', action: 'Select all occurrences' },
  { keys: 'Shift + Alt + Drag', action: 'Column (box) selection' },
  { keys: 'Escape', action: 'Back to a single cursor' },
  { keys: 'Shift + Alt + ↓ / ↑', action: 'Duplicate line down / up' },
  { keys: 'Alt + ↑ / ↓', action: 'Move line up / down' },
  { keys: 'Ctrl + Shift + K', action: 'Delete line' },
  { keys: 'Ctrl + X / C', action: 'Cut / copy line (no selection)' },
  { keys: 'Ctrl + Space', action: 'Trigger suggestions' },
  { keys: 'Ctrl + Shift + Space', action: 'Parameter hints' },
  { keys: 'F12', action: 'Go to definition' },
  { keys: 'F2 (in editor)', action: 'Rename symbol' },
];
