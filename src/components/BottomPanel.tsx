import { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, Info, Trash2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { previewBridge } from '../lib/editorBridge';
import { formatTime } from '../lib/paths';
import type { BottomTab, LogLevel } from '../types';

const LEVEL_STYLE: Record<LogLevel, string> = {
  log: 'text-ws-text',
  info: 'text-sky-300',
  debug: 'text-ws-muted',
  warn: 'text-amber-300 bg-amber-400/5',
  error: 'text-red-400 bg-red-500/5',
  system: 'text-ws-muted italic',
  result: 'text-emerald-300',
};

function ConsoleView() {
  const logs = useStore((s) => s.logs);
  const clearLogs = useStore((s) => s.clearLogs);
  const openFile = useStore((s) => s.openFile);
  const [input, setInput] = useState('');
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const run = () => {
    const code = input.trim();
    if (!code) return;
    history.current.unshift(code);
    hIdx.current = -1;
    useStore.getState().addLog('system', `> ${code}`);
    if (!previewBridge.evaluate(code)) useStore.getState().addLog('warn', 'Preview is not running — open an HTML page first.');
    setInput('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="min-h-0 flex-1 overflow-auto font-mono text-xs"
      >
        {logs.length === 0 && <p className="p-3 text-ws-muted">Console output from your page appears here. Use console.log() in script.js.</p>}
        {logs.map((l) => (
          <div key={l.id} className={`flex gap-2 border-b border-ws-border/40 px-3 py-1 ${LEVEL_STYLE[l.level]}`}>
            <span className="shrink-0 text-[10px] leading-5 text-ws-muted">{formatTime(l.time)}</span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{l.text}</span>
            {l.file && (
              <button className="shrink-0 text-[11px] text-ws-muted underline-offset-2 hover:text-ws-accent hover:underline" onClick={() => openFile(l.file!, l.line, l.column)}>
                {l.file}:{l.line}
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 border-t border-ws-border bg-ws-editor px-3 py-1.5 font-mono text-xs">
        <ChevronRight size={13} className="text-ws-accent" />
        <input
          aria-label="Evaluate JavaScript in the preview"
          value={input}
          placeholder="Evaluate JavaScript in the preview…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run();
            if (e.key === 'ArrowUp' && history.current.length) {
              hIdx.current = Math.min(hIdx.current + 1, history.current.length - 1);
              setInput(history.current[hIdx.current]);
              e.preventDefault();
            }
            if (e.key === 'ArrowDown') {
              hIdx.current = Math.max(hIdx.current - 1, -1);
              setInput(hIdx.current < 0 ? '' : history.current[hIdx.current]);
              e.preventDefault();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-ws-text outline-none placeholder:text-ws-muted/60"
        />
        <button className="icon-btn !h-6 !w-6" title="Clear console" onClick={clearLogs}><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

function ProblemsView() {
  const problems = useStore((s) => s.problems);
  const openFile = useStore((s) => s.openFile);
  if (!problems.length) return <p className="p-3 text-xs text-ws-muted">No problems detected in open files.</p>;
  return (
    <div className="h-full overflow-auto text-xs">
      {problems.map((p) => (
        <button key={p.id} onClick={() => openFile(p.file, p.line, p.column)} className="flex w-full items-start gap-2 border-b border-ws-border/40 px-3 py-1.5 text-left hover:bg-ws-hover">
          {p.severity === 'error' ? <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" /> : p.severity === 'warning' ? <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" /> : <Info size={14} className="mt-0.5 shrink-0 text-sky-300" />}
          <span className="min-w-0 flex-1">
            <span className="text-ws-text">{p.message}</span>
            {p.source && <span className="ml-1.5 text-ws-muted">{p.source}</span>}
          </span>
          <span className="shrink-0 text-ws-muted">{p.file} [{p.line}:{p.column}]</span>
        </button>
      ))}
    </div>
  );
}

function OutputView() {
  const output = useStore((s) => s.output);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [output]);
  const color = { info: 'text-ws-muted', success: 'text-emerald-300', error: 'text-red-400' } as const;
  return (
    <div ref={ref} className="h-full overflow-auto px-3 py-2 font-mono text-xs">
      {output.length === 0 && <p className="text-ws-muted">Build, save and formatting messages appear here.</p>}
      {output.map((o) => (
        <div key={o.id} className={color[o.kind]}>
          <span className="mr-2 text-[10px] text-ws-muted">{formatTime(o.time)}</span>
          {o.text}
        </div>
      ))}
    </div>
  );
}

function TerminalView() {
  return (
    <div className="grid h-full place-items-center p-4 text-center">
      <div className="max-w-md text-xs leading-relaxed text-ws-muted">
        <h4 className="mb-1 text-sm font-semibold text-ws-text">No terminal backend connected</h4>
        WebStudio runs entirely in your browser, so there is no real shell here and none is simulated.
        The <b className="text-ws-text">Console</b> tab shows output from your page and can evaluate JavaScript inside the preview —
        it is a browser console, not a system terminal. A real terminal needs a server-side execution backend (for example a container
        or WebContainers) to be added.
      </div>
    </div>
  );
}

export function BottomPanel() {
  const tab = useStore((s) => s.bottomTab);
  const setTab = useStore((s) => s.setBottomTab);
  const toggleBottom = useStore((s) => s.toggleBottom);
  const logs = useStore((s) => s.logs);
  const problems = useStore((s) => s.problems);
  const clearLogs = useStore((s) => s.clearLogs);
  const clearOutput = useStore((s) => s.clearOutput);

  const errors = logs.filter((l) => l.level === 'error').length;
  const tabs: { id: BottomTab; label: string; count?: number; hot?: boolean }[] = [
    { id: 'console', label: 'Console', count: logs.filter((l) => l.level !== 'system').length, hot: errors > 0 },
    { id: 'problems', label: 'Problems', count: problems.length, hot: problems.some((p) => p.severity === 'error') },
    { id: 'output', label: 'Output' },
    { id: 'terminal', label: 'Terminal' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-panel">
      <div className="flex h-8 shrink-0 items-center border-b border-ws-border px-2">
        <div role="tablist" className="flex gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${tab === t.id ? 'bg-ws-accent/15 text-ws-accent' : 'text-ws-muted hover:text-ws-text'}`}
            >
              {t.label}
              {!!t.count && <span className={`rounded-full px-1.5 text-[10px] ${t.hot ? 'bg-red-500/20 text-red-300' : 'bg-ws-border text-ws-muted'}`}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {(tab === 'console' || tab === 'output') && (
            <button className="icon-btn" title="Clear" onClick={tab === 'console' ? clearLogs : clearOutput}><Trash2 size={13} /></button>
          )}
          <button className="icon-btn" title="Hide panel (Ctrl+`)" onClick={() => toggleBottom(false)}><X size={14} /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'console' && <ConsoleView />}
        {tab === 'problems' && <ProblemsView />}
        {tab === 'output' && <OutputView />}
        {tab === 'terminal' && <TerminalView />}
      </div>
    </div>
  );
}
