import { AlertCircle, AlertTriangle, PanelBottom } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useCursor } from '../store/useCursor';
import { languageFor } from '../lib/paths';

const LABEL: Record<string, string> = {
  html: 'HTML', css: 'CSS', javascript: 'JavaScript', typescript: 'TypeScript', json: 'JSON', markdown: 'Markdown', xml: 'XML', plaintext: 'Plain Text',
};

export function StatusBar() {
  const { line, column, selected } = useCursor();
  const activePath = useStore((s) => s.activePath);
  const problems = useStore((s) => s.problems);
  const settings = useStore((s) => s.settings);
  const bottomVisible = useStore((s) => s.bottomVisible);
  const errors = problems.filter((p) => p.severity === 'error').length;
  const warnings = problems.filter((p) => p.severity === 'warning').length;
  const st = useStore.getState();

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 bg-ws-accent px-3 text-[11px] text-white">
      <button className="flex items-center gap-1.5 hover:underline" onClick={() => st.setBottomTab('problems')} title="Show problems">
        <AlertCircle size={12} />{errors}
        <AlertTriangle size={12} className="ml-1" />{warnings}
      </button>
      <div className="ml-auto flex items-center gap-3">
        {activePath && (
          <>
            <span>Ln {line}, Col {column}{selected ? ` (${selected} selected)` : ''}</span>
            <span className="hidden sm:inline">Spaces: {settings.tabSize}</span>
            <span className="hidden sm:inline">UTF-8</span>
            <span>{LABEL[languageFor(activePath)]}</span>
          </>
        )}
        <button title="Toggle bottom panel (Ctrl+`)" aria-pressed={bottomVisible} onClick={() => st.toggleBottom()} className="grid place-items-center rounded px-1 hover:bg-white/15"><PanelBottom size={13} /></button>
      </div>
    </footer>
  );
}
