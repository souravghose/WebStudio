import { useEffect, useRef } from 'react';
import { useStore, onProjectSaved } from './store/useStore';
import { useShortcuts } from './hooks/useShortcuts';
import { useProblems } from './hooks/useProblems';
import { useMediaQuery } from './hooks/useMediaQuery';
import { TopBar } from './components/TopBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorArea } from './components/EditorArea';
import { PreviewPane } from './components/PreviewPane';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { DialogHost } from './components/DialogHost';
import { Splitter } from './components/ui/Splitter';

export default function App() {
  const ready = useStore((s) => s.ready);
  const layout = useStore((s) => s.layout);
  const sidebarVisible = useStore((s) => s.sidebarVisible);
  const sidebarWidth = useStore((s) => s.sidebarWidth);
  const bottomVisible = useStore((s) => s.bottomVisible);
  const bottomHeight = useStore((s) => s.bottomHeight);
  const editorRatio = useStore((s) => s.editorRatio);
  const compact = useMediaQuery('(max-width: 767px)');
  const splitRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useShortcuts();
  useProblems();

  useEffect(() => {
    void useStore.getState().init();
    // start with the drawer closed on phones
    if (window.matchMedia('(max-width: 767px)').matches) useStore.setState({ sidebarVisible: false });
  }, []);

  // another tab saved a project we also have open: don't silently overwrite its work
  useEffect(
    () =>
      onProjectSaved((id) => {
        if (id === useStore.getState().currentId) {
          useStore.getState().addOutput('info', 'This project was saved from another WebStudio tab. Reload to see those changes — saving here will overwrite them.');
        }
      }),
    [],
  );

  // warn before leaving with unsaved work when autosave is off
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const s = useStore.getState();
      if (s.saveStatus === 'unsaved' || s.saveStatus === 'saving') {
        void s.saveNow();
        if (!s.settings.autoSave) e.preventDefault();
      }
    };
    // flush a pending autosave as soon as the tab is hidden (switching tabs, closing, mobile app switch)
    const onHide = () => {
      if (document.visibilityState === 'hidden' && useStore.getState().saveStatus === 'saving') void useStore.getState().saveNow();
    };
    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', handler);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid h-full place-items-center bg-ws-bg text-sm text-ws-muted">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 animate-pulse place-items-center rounded-lg bg-gradient-to-br from-ws-accent to-ws-accent2 font-extrabold text-white">W</div>
          Loading WebStudio…
        </div>
      </div>
    );
  }

  const split = layout === 'split';
  const stacked = compact; // editor above preview on narrow screens

  const editorStyle: React.CSSProperties =
    layout === 'preview' ? { display: 'none' } : split ? { flex: `0 0 ${editorRatio * 100}%` } : { flex: 1 };
  const previewStyle: React.CSSProperties = layout === 'editor' ? { display: 'none' } : { flex: 1 };

  return (
    <div className="flex h-full flex-col bg-ws-bg text-ws-text">
      <TopBar />
      <div ref={bodyRef} className="relative flex min-h-0 flex-1">
        <ActivityBar />

        {sidebarVisible && compact && (
          <>
            <div className="absolute inset-0 z-30 bg-black/50" onClick={() => useStore.getState().toggleSidebar(false)} />
            <div className="absolute inset-y-0 left-0 z-40 w-[85%] max-w-[320px] border-r border-ws-border shadow-2xl"><Sidebar /></div>
          </>
        )}
        {sidebarVisible && !compact && (
          <>
            <div style={{ width: sidebarWidth }} className="shrink-0"><Sidebar /></div>
            <Splitter orientation="vertical" label="Resize sidebar" onDrag={(x) => useStore.getState().setSidebarWidth(x - (bodyRef.current?.getBoundingClientRect().left ?? 0) - 48)} />
          </>
        )}

        <div ref={columnRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={splitRef} className={`flex min-h-0 min-w-0 flex-1 ${stacked ? 'flex-col' : 'flex-row'}`}>
            <div style={editorStyle} className="flex min-h-0 min-w-0 flex-col [&>*]:min-h-0 [&>*]:flex-1">
              <EditorArea />
            </div>
            {split && (
              <Splitter
                orientation={stacked ? 'horizontal' : 'vertical'}
                label="Resize editor and preview"
                onDoubleClick={() => useStore.getState().setEditorRatio(0.5)}
                onDrag={(x, y) => {
                  const r = splitRef.current?.getBoundingClientRect();
                  if (r) useStore.getState().setEditorRatio(stacked ? (y - r.top) / r.height : (x - r.left) / r.width);
                }}
              />
            )}
            <div style={previewStyle} className="flex min-h-0 min-w-0 flex-col [&>*]:min-h-0 [&>*]:flex-1">
              <PreviewPane />
            </div>
          </div>

          {bottomVisible && (
            <>
              <Splitter
                orientation="horizontal"
                label="Resize bottom panel"
                onDrag={(_x, y) => {
                  const r = columnRef.current?.getBoundingClientRect();
                  if (r) useStore.getState().setBottomHeight(r.bottom - y);
                }}
              />
              <div style={{ height: bottomHeight }} className="shrink-0"><BottomPanel /></div>
            </>
          )}
        </div>
      </div>
      <StatusBar />
      <DialogHost />
    </div>
  );
}
