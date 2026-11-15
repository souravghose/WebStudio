import { useEffect } from 'react';
import { monaco } from '../lib/monacoSetup';
import { useStore } from '../store/useStore';
import type { Problem } from '../types';

/** Mirror Monaco's diagnostics (HTML/CSS/JS/JSON language services) into the Problems panel. */
export function useProblems() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const collect = () => {
      const { currentId, setProblems } = useStore.getState();
      if (!currentId) return setProblems([]);
      const prefix = `/${currentId}/`;
      const problems: Problem[] = monaco.editor
        .getModelMarkers({})
        .filter((m) => m.resource.path.startsWith(prefix))
        .map((m) => ({
          id: `${m.resource.path}:${m.startLineNumber}:${m.startColumn}:${m.message}`,
          severity: m.severity === monaco.MarkerSeverity.Error ? 'error' : m.severity === monaco.MarkerSeverity.Warning ? 'warning' : 'info',
          message: m.message,
          file: m.resource.path.slice(prefix.length),
          line: m.startLineNumber,
          column: m.startColumn,
          source: m.source ?? (typeof m.code === 'string' ? m.code : undefined),
        }));
      problems.sort((a, b) => (a.severity === b.severity ? a.file.localeCompare(b.file) || a.line - b.line : a.severity === 'error' ? -1 : 1));
      setProblems(problems);
    };
    const sub = monaco.editor.onDidChangeMarkers(() => {
      clearTimeout(timer);
      timer = setTimeout(collect, 200);
    });
    const unsub = useStore.subscribe((s, prev) => {
      if (s.currentId !== prev.currentId) collect();
    });
    collect();
    return () => {
      clearTimeout(timer);
      sub.dispose();
      unsub();
    };
  }, []);
}
