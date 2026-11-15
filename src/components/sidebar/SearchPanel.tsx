import { useEffect, useMemo, useRef, useState } from 'react';
import { CaseSensitive, ChevronDown, ChevronRight, Regex, Replace, ReplaceAll, WholeWord } from 'lucide-react';
import { useCurrentProject, useStore } from '../../store/useStore';
import { FileIcon } from '../ui/FileIcon';

interface Hit { line: number; column: number; length: number; text: string }
interface FileResult { path: string; hits: Hit[] }

const MAX_HITS = 500;

function buildRegex(query: string, o: { caseSensitive: boolean; regex: boolean; word: boolean }): RegExp | string {
  if (!query) return '';
  try {
    let src = o.regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (o.word) src = `\\b(?:${src})\\b`;
    return new RegExp(src, o.caseSensitive ? 'g' : 'gi');
  } catch (e) {
    return (e as Error).message;
  }
}

export function SearchPanel() {
  const project = useCurrentProject();
  const focusTick = useStore((s) => s.searchFocusTick);
  const openFile = useStore((s) => s.openFile);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCase] = useState(false);
  const [regex, setRegex] = useState(false);
  const [word, setWord] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, [focusTick]);

  const compiled = useMemo(() => buildRegex(query, { caseSensitive, regex, word }), [query, caseSensitive, regex, word]);
  const error = typeof compiled === 'string' && compiled ? compiled : null;

  const { results, total, truncated } = useMemo(() => {
    const out: FileResult[] = [];
    let count = 0;
    let cut = false;
    if (!project || !(compiled instanceof RegExp)) return { results: out, total: 0, truncated: false };
    for (const n of project.nodes) {
      if (n.type !== 'file' || n.binary) continue;
      const hits: Hit[] = [];
      const lines = n.content.split('\n');
      for (let i = 0; i < lines.length && !cut; i++) {
        compiled.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = compiled.exec(lines[i])) !== null) {
          if (m[0] === '') {
            compiled.lastIndex++;
            continue;
          }
          hits.push({ line: i + 1, column: m.index + 1, length: m[0].length, text: lines[i] });
          if (++count >= MAX_HITS) {
            cut = true;
            break;
          }
        }
      }
      if (hits.length) out.push({ path: n.path, hits });
      if (cut) break;
    }
    return { results: out, total: count, truncated: cut };
  }, [project, compiled]);

  const expandReplacement = (r: string) => (regex ? r : r.replace(/\$/g, '$$$$'));

  const replaceIn = (paths: string[]) => {
    if (!project || !(compiled instanceof RegExp)) return;
    const changes = project.nodes
      .filter((n) => paths.includes(n.path) && n.type === 'file' && !n.binary)
      .map((n) => ({ path: n.path, content: n.content.replace(new RegExp(compiled.source, compiled.flags), expandReplacement(replacement)) }));
    useStore.getState().replaceInFiles(changes);
    useStore.getState().addOutput('success', `Replaced matches in ${changes.length} file${changes.length === 1 ? '' : 's'}.`);
  };

  const replaceAll = () =>
    useStore.getState().openDialog({
      kind: 'confirm',
      title: 'Replace all',
      message: `Replace ${total}${truncated ? '+' : ''} match${total === 1 ? '' : 'es'} in ${results.length} file${results.length === 1 ? '' : 's'}? You can undo per file with Ctrl+Z while it's open in the editor.`,
      confirmLabel: 'Replace all',
      onConfirm: () => replaceIn(results.map((r) => r.path)),
    });

  const toggle = (on: boolean, set: (v: boolean) => void, title: string, icon: React.ReactNode) => (
    <button title={title} aria-pressed={on} onClick={() => set(!on)} className={`icon-btn !h-6 !w-6 ${on ? 'active' : ''}`}>{icon}</button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">Search</span>
      </div>
      <div className="space-y-2 px-3 pb-2">
        <div className="flex items-center gap-1 rounded-md border border-ws-border bg-ws-editor pr-1 focus-within:border-ws-accent">
          <input ref={ref} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search in files" aria-label="Search" className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs outline-none" />
          {toggle(caseSensitive, setCase, 'Match case', <CaseSensitive size={14} />)}
          {toggle(word, setWord, 'Whole word', <WholeWord size={14} />)}
          {toggle(regex, setRegex, 'Use regular expression', <Regex size={14} />)}
        </div>
        <div className="flex items-center gap-1 rounded-md border border-ws-border bg-ws-editor pr-1 focus-within:border-ws-accent">
          <input value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="Replace with" aria-label="Replace with" className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs outline-none" />
          <button className="icon-btn !h-6 !w-6" title="Replace all" disabled={!total} onClick={replaceAll}><ReplaceAll size={14} /></button>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        {query && !error && (
          <p className="text-[11px] text-ws-muted">{total ? `${total}${truncated ? '+' : ''} result${total === 1 ? '' : 's'} in ${results.length} file${results.length === 1 ? '' : 's'}` : 'No results found.'}</p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {results.map((r) => {
          const isCollapsed = collapsed[r.path];
          return (
            <div key={r.path}>
              <div className="group flex h-[26px] cursor-pointer items-center gap-1 px-2 text-xs text-ws-text hover:bg-ws-hover" onClick={() => setCollapsed({ ...collapsed, [r.path]: !isCollapsed })}>
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                <FileIcon path={r.path} size={13} />
                <span className="min-w-0 flex-1 truncate">{r.path}</span>
                <button className="icon-btn !h-5 !w-5 opacity-0 group-hover:opacity-100" title="Replace in this file" onClick={(e) => { e.stopPropagation(); replaceIn([r.path]); }}><Replace size={12} /></button>
                <span className="rounded-full bg-ws-border px-1.5 text-[10px] text-ws-muted">{r.hits.length}</span>
              </div>
              {!isCollapsed && r.hits.map((h, i) => {
                const start = Math.max(0, h.column - 1 - 24);
                const pre = h.text.slice(start, h.column - 1);
                const mid = h.text.slice(h.column - 1, h.column - 1 + h.length);
                const post = h.text.slice(h.column - 1 + h.length, h.column - 1 + h.length + 60);
                return (
                  <button key={i} onClick={() => openFile(r.path, h.line, h.column)} className="block w-full truncate py-0.5 pl-8 pr-2 text-left font-mono text-[11px] text-ws-muted hover:bg-ws-hover">
                    {start > 0 && '…'}{pre.trimStart()}<mark className="rounded-sm bg-ws-accent/40 text-ws-strong">{mid}</mark>{post}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
