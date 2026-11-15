// Loaded only on the #/editor route. Monaco must be configured before any <Editor/> renders,
// so this import stays first (it used to live in main.tsx).
import './lib/monacoSetup';
import { useEffect } from 'react';
import App from './App';
import { useStore } from './store/useStore';
import { popIntent, runIntent } from './home/launch';

/**
 * Wraps the existing, unmodified <App/>. It only (1) applies a homepage "start here" request
 * once the editor's store has finished loading and (2) lets the editor re-initialise cleanly if
 * the visitor goes Home and comes back.
 */
export default function EditorRoute() {
  useEffect(() => {
    const intent = popIntent();
    if (!intent) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const apply = () => {
      // let init() finish its own synchronous work (switchTo) before we touch projects
      timer = setTimeout(() => {
        if (!cancelled) void runIntent(intent);
      }, 0);
    };

    let unsub: (() => void) | undefined;
    if (useStore.getState().ready) apply();
    else {
      unsub = useStore.subscribe((s) => {
        if (s.ready) {
          unsub?.();
          apply();
        }
      });
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      // Flush any pending autosave when leaving the editor (e.g. browser Back).
      // We do NOT reset ready:false here — init() uses a module-level guard (initStarted)
      // so calling it twice is a no-op; keeping ready:true means App renders instantly on
      // the next visit without getting stuck on the loading splash.
      void useStore.getState().saveNow();
    };
  }, []);

  return <App />;
}
