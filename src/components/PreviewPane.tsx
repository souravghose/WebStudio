import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Globe, Maximize2, Minimize2, Monitor, MousePointerClick, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { useCurrentProject, useStore } from '../store/useStore';
import { buildPreview, buildStandalonePage, mapErrorLocation, type PreviewSegment } from '../lib/preview';
import { previewBridge } from '../lib/editorBridge';
import { uid } from '../lib/paths';
import type { Device } from '../types';

const DEVICES: { id: Device; label: string; icon: typeof Monitor; width: string }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', label: 'Tablet (768px)', icon: Tablet, width: '768px' },
  { id: 'mobile', label: 'Mobile (390px)', icon: Smartphone, width: '390px' },
];

export function PreviewPane() {
  const project = useCurrentProject();
  const previewPath = useStore((s) => s.previewPath);
  const previewNonce = useStore((s) => s.previewNonce);
  const device = useStore((s) => s.device);
  const settings = useStore((s) => s.settings);
  const { setDevice, refreshPreview, addLog, clearLogs, navigatePreview } = useStore.getState();

  const [srcDoc, setSrcDoc] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const tokenRef = useRef('');
  const segmentsRef = useRef<PreviewSegment[]>([]);
  const lastTrigger = useRef('');

  const htmlFiles = useMemo(
    () => (project?.nodes ?? []).filter((n) => n.type === 'file' && /\.html?$/i.test(n.path)).map((n) => n.path),
    [project?.nodes],
  );
  const hasEntry = htmlFiles.includes(previewPath);

  // Build the preview: immediately for manual runs / navigation, debounced for typing.
  useEffect(() => {
    if (!project) return;
    const trigger = `${project.id}|${previewPath}|${previewNonce}`;
    const manual = trigger !== lastTrigger.current;
    lastTrigger.current = trigger;
    if (!manual && !settings.autoRun) return;

    const run = () => {
      if (!hasEntry) {
        setSrcDoc('');
        return;
      }
      const token = uid();
      const build = buildPreview(project.nodes, previewPath, token);
      tokenRef.current = token;
      segmentsRef.current = build.segments;
      if (settings.clearConsoleOnRun) clearLogs();
      if (manual) addLog('system', `Preview loaded · ${previewPath}`);
      build.missing.forEach((m) => addLog('warn', `Referenced file not found in project: ${m}`));
      setSrcDoc(build.html);
    };
    const timer = setTimeout(run, manual ? 0 : settings.previewDelay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.nodes, project?.id, previewPath, previewNonce, hasEntry, settings.autoRun, settings.previewDelay]);

  // Messages from the sandboxed iframe: accepted only from our frame and only with the current token.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { __webstudio?: string; type?: string; level?: string; text?: string; message?: string; line?: number; column?: number; href?: string } | null;
      if (!d || typeof d !== 'object' || d.__webstudio !== tokenRef.current) return;
      const st = useStore.getState();
      switch (d.type) {
        case 'console':
          st.addLog((d.level as 'log') ?? 'log', String(d.text ?? ''));
          break;
        case 'clear':
          st.clearLogs();
          break;
        case 'runtime-error': {
          const loc = d.line ? mapErrorLocation(segmentsRef.current, st.previewPath, d.line) : undefined;
          st.addLog('error', String(d.message ?? 'Error'), loc ? { file: loc.file, line: loc.line, column: d.column } : undefined);
          break;
        }
        case 'navigate':
          navigatePreview(String(d.href ?? ''));
          break;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigatePreview]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === paneRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => () => previewBridge.register(null, ''), []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void paneRef.current?.requestFullscreen?.();
  };

  const openInTab = () => {
    if (!project || !hasEntry) return;
    const build = buildPreview(project.nodes, previewPath, uid());
    const page = buildStandalonePage(build.html, project.name);
    const url = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const width = DEVICES.find((d) => d.id === device)!.width;

  return (
    <div ref={paneRef} className="flex min-h-0 min-w-0 flex-col bg-ws-panel">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-ws-border bg-ws-side px-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-ws-border bg-ws-editor px-2 py-1 text-[11px] text-ws-muted">
          <Globe size={12} className="shrink-0" />
          <span className="hidden shrink-0 sm:inline">webstudio.local/</span>
          {htmlFiles.length > 1 ? (
            <select
              aria-label="Preview page"
              value={hasEntry ? previewPath : ''}
              onChange={(e) => useStore.setState({ previewPath: e.target.value })}
              className="min-w-0 flex-1 truncate bg-transparent text-ws-text outline-none"
            >
              {htmlFiles.map((f) => (
                <option key={f} value={f} className="bg-ws-panel">{f}</option>
              ))}
            </select>
          ) : (
            <span className="truncate text-ws-text">{hasEntry ? previewPath : '—'}</span>
          )}
        </div>
        {DEVICES.map(({ id, label, icon: Icon }) => (
          <button key={id} title={label} aria-pressed={device === id} className={`icon-btn ${device === id ? 'active' : ''}`} onClick={() => setDevice(id)}>
            <Icon size={14} />
          </button>
        ))}
        <button className="icon-btn" title="Refresh preview (Ctrl+Enter)" onClick={refreshPreview}><RefreshCw size={14} /></button>
        <button className="icon-btn" title="Open in new tab" onClick={openInTab} disabled={!hasEntry}><ExternalLink size={14} /></button>
        <button className="icon-btn" title={fullscreen ? 'Exit fullscreen' : 'Fullscreen preview'} onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 justify-center overflow-auto bg-ws-stage p-0">
        {hasEntry ? (
          <iframe
            ref={frameRef}
            title="Website preview"
            srcDoc={srcDoc}
            // No allow-same-origin: the project runs on an opaque origin and can't touch this app's
            // storage, cookies or DOM. It can only talk back through postMessage (token-checked above).
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => previewBridge.register(frameRef.current?.contentWindow ?? null, tokenRef.current)}
            style={{ width, maxWidth: '100%' }}
            className={`h-full border-0 bg-white transition-[width] duration-200 ${device !== 'desktop' ? 'my-3 h-[calc(100%-1.5rem)] rounded-md shadow-2xl shadow-black/60' : ''}`}
          />
        ) : (
          <div className="grid place-items-center p-6 text-center">
            <div className="max-w-xs">
              <MousePointerClick size={38} className="mx-auto mb-3 text-ws-accent" strokeWidth={1.4} />
              <h3 className="text-sm font-semibold">Nothing to preview yet</h3>
              <p className="mt-1 text-xs leading-relaxed text-ws-muted">
                Add an <code className="rounded bg-ws-editor px-1">index.html</code> file to your project and the live preview will appear here.
              </p>
              <button
                className="btn btn-primary mt-3"
                onClick={() => {
                  const st = useStore.getState();
                  st.createFile('index.html', '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n  <title>New page</title>\n</head>\n<body>\n  <h1>Hello!</h1>\n</body>\n</html>\n');
                  useStore.setState({ previewPath: 'index.html' });
                }}
              >
                Create index.html
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
