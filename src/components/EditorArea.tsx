import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { Code2, Minus, Plus, WrapText, X } from 'lucide-react';
import { monaco, THEME } from '../lib/monacoSetup';
import { editorBridge } from '../lib/editorBridge';
import { exportProject, formatActive, runPreview, saveProject } from '../lib/actions';
import { basename, isImage, languageFor } from '../lib/paths';
import { useCurrentProject, useStore } from '../store/useStore';
import { useCursor } from '../store/useCursor';
import { ContextMenu, type MenuItem } from './ui/ContextMenu';
import { FileIcon } from './ui/FileIcon';

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);

export function EditorArea() {
  const project = useCurrentProject();
  const openTabs = useStore((s) => s.openTabs);
  const activePath = useStore((s) => s.activePath);
  const dirty = useStore((s) => s.dirty);
  const settings = useStore((s) => s.settings);
  const revealTarget = useStore((s) => s.revealTarget);
  const { setActive, closeTab, closeOtherTabs, updateContent, updateSettings } = useStore.getState();
  const [menu, setMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  const node = useMemo(() => project?.nodes.find((n) => n.path === activePath && n.type === 'file'), [project?.nodes, activePath]);
  const projectId = project?.id ?? '';

  // Keep Monaco models in step with the project: drop models of deleted files / other projects,
  // and push external edits (e.g. Replace All from the Search panel) into models that aren't active.
  useEffect(() => {
    if (!project) return;
    const prefix = `/${project.id}/`;
    const byPath = new Map(project.nodes.map((n) => [n.path, n]));
    for (const model of monaco.editor.getModels()) {
      if (model.uri.scheme !== 'file') continue;
      if (!model.uri.path.startsWith(prefix)) {
        model.dispose();
        continue;
      }
      const n = byPath.get(model.uri.path.slice(prefix.length));
      if (!n || n.type !== 'file') {
        model.dispose();
      } else if (!n.binary && model.getValue() !== n.content && n.path !== activePath) {
        model.pushEditOperations([], [{ range: model.getFullModelRange(), text: n.content }], () => null);
      }
    }
  }, [project, activePath]);

  useEffect(() => {
    if (revealTarget && revealTarget.path === activePath) editorBridge.reveal(revealTarget.line, revealTarget.column);
  }, [revealTarget, activePath]);

  const onMount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorBridge.set(editor);
    const { KeyMod, KeyCode } = monaco;
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => void saveProject());
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyS, () => void exportProject());
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF, () => useStore.getState().focusSearch());
    editor.addCommand(KeyMod.Alt | KeyMod.Shift | KeyCode.KeyF, () => void formatActive());
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => runPreview());
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyB, () => useStore.getState().toggleSidebar());
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Backquote, () => useStore.getState().toggleBottom());

    editor.onDidChangeCursorPosition((e) => {
      const sel = editor.getSelection();
      const model = editor.getModel();
      useCursor.getState().set(e.position.lineNumber, e.position.column, sel && model ? model.getValueInRange(sel).length : 0);
    });

    // Auto-close HTML tags: typing ">" after "<div class='x'" inserts "</div>" and keeps the cursor between.
    editor.onDidChangeModelContent((e) => {
      if (e.isUndoing || e.isRedoing || e.isFlush || e.changes.length !== 1) return;
      const change = e.changes[0];
      if (change.text !== '>' || change.rangeLength !== 0 || !useStore.getState().settings.autoCloseTags) return;
      const model = editor.getModel();
      if (!model || model.getLanguageId() !== 'html') return;
      const line = change.range.startLineNumber;
      const col = change.range.startColumn + 1; // cursor position right after the typed ">"
      // Defer past the content-change callback (Monaco can't start edits from inside it). A microtask runs
      // before the next keystroke is processed, so fast typing can't race the cursor position.
      queueMicrotask(() => {
        if (editor.getModel() !== model) return;
        const before = model.getValueInRange({ startLineNumber: Math.max(1, line - 20), startColumn: 1, endLineNumber: line, endColumn: col });
        const m = before.match(/<([a-zA-Z][\w:-]*)(?:\s[^<>]*)?>$/);
        if (!m || before.endsWith('/>') || VOID_TAGS.has(m[1].toLowerCase())) return;
        const closing = `</${m[1]}>`;
        const after = model.getValueInRange({ startLineNumber: line, startColumn: col, endLineNumber: line, endColumn: col + closing.length });
        if (after === closing) return;
        editor.executeEdits('autoclose-tag', [{ range: new monaco.Range(line, col, line, col), text: closing }]);
        editor.setPosition({ lineNumber: line, column: col });
      });
    });
  };

  const tabMenu = (path: string): MenuItem[] => [
    { label: 'Close', onClick: () => closeTab(path) },
    { label: 'Close others', disabled: openTabs.length < 2, onClick: () => closeOtherTabs(path) },
    { divider: true },
    { label: 'Copy path', onClick: () => void navigator.clipboard?.writeText(path) },
  ];

  const lang = activePath ? languageFor(activePath) : 'plaintext';
  const showMonaco = !!node && !node.binary;

  return (
    <div className="flex min-h-0 min-w-0 flex-col bg-ws-editor">
      {/* tab strip */}
      <div className="flex h-9 shrink-0 items-stretch border-b border-ws-border bg-ws-side">
        <div className="flex min-w-0 flex-1 overflow-x-auto" role="tablist">
          {openTabs.map((path) => {
            const active = path === activePath;
            return (
              <div
                key={path}
                role="tab"
                aria-selected={active}
                title={path}
                onClick={() => setActive(path)}
                onAuxClick={(e) => e.button === 1 && closeTab(path)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ x: e.clientX, y: e.clientY, path });
                }}
                className={`group relative flex shrink-0 cursor-pointer items-center gap-2 border-r border-ws-border px-3 text-xs transition-colors ${active ? 'bg-ws-editor text-ws-text' : 'text-ws-muted hover:bg-ws-hover'}`}
              >
                {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-ws-accent" />}
                <FileIcon path={path} size={14} />
                <span>{basename(path)}</span>
                {dirty[path] ? (
                  <span className="ml-1 h-2 w-2 rounded-full bg-ws-text/70" title="Unsaved changes" />
                ) : null}
                <button
                  aria-label={`Close ${basename(path)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(path);
                  }}
                  className={`ml-0.5 rounded p-0.5 text-ws-muted hover:bg-ws-border hover:text-ws-text ${dirty[path] ? 'hidden group-hover:block' : active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 border-l border-ws-border px-1.5">
          <button className="icon-btn" title="Decrease font size" onClick={() => updateSettings({ fontSize: Math.max(10, settings.fontSize - 1) })}><Minus size={13} /></button>
          <span className="w-6 text-center text-[11px] tabular-nums text-ws-muted">{settings.fontSize}</span>
          <button className="icon-btn" title="Increase font size" onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}><Plus size={13} /></button>
          <button className={`icon-btn ${settings.wordWrap ? 'active' : ''}`} title="Toggle word wrap" onClick={() => updateSettings({ wordWrap: !settings.wordWrap })}><WrapText size={14} /></button>
        </div>
      </div>

      {/* body */}
      <div className="relative min-h-0 flex-1">
        {showMonaco && node && (
          <Editor
            height="100%"
            theme={THEME}
            path={`/${projectId}/${node.path}`}
            language={lang}
            value={node.content}
            keepCurrentModel
            onMount={onMount}
            onChange={(v) => updateContent(node.path, v ?? '')}
            loading={<div className="p-5 text-sm text-ws-muted">Loading editor…</div>}
            options={{
              fontFamily: '"JetBrains Mono","Fira Code",ui-monospace,SFMono-Regular,Menlo,monospace',
              fontLigatures: true,
              fontSize: settings.fontSize,
              tabSize: settings.tabSize,
              insertSpaces: true,
              detectIndentation: false,
              wordWrap: settings.wordWrap ? 'on' : 'off',
              minimap: { enabled: settings.minimap },
              lineNumbers: settings.lineNumbers ? 'on' : 'off',
              folding: true,
              autoIndent: 'full',
              matchBrackets: 'always',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoClosingOvertype: 'always',
              autoSurround: 'languageDefined',
              linkedEditing: settings.linkedEditing,
              bracketPairColorization: { enabled: settings.bracketColors },
              guides: { bracketPairs: true, indentation: true },
              quickSuggestions: { other: true, comments: false, strings: true },
              suggestOnTriggerCharacters: true,
              tabCompletion: 'on',
              snippetSuggestions: 'inline',
              parameterHints: { enabled: true },
              formatOnPaste: false,
              mouseWheelZoom: true,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              renderWhitespace: 'selection',
              scrollBeyondLastLine: false,
              padding: { top: 10, bottom: 10 },
              automaticLayout: true,
              fixedOverflowWidgets: true,
              contextmenu: true,
            }}
          />
        )}

        {node?.binary && (
          <div className="absolute inset-0 grid place-items-center overflow-auto bg-ws-editor p-6 text-center">
            {isImage(node.path) ? (
              <div>
                <img src={node.content} alt={node.path} className="mx-auto max-h-[60vh] max-w-full rounded-lg border border-ws-border bg-[repeating-conic-gradient(#1b2433_0%_25%,#0f1623_0%_50%)] bg-[length:16px_16px]" />
                <p className="mt-3 text-xs text-ws-muted">{node.path}</p>
              </div>
            ) : (
              <p className="text-sm text-ws-muted">{node.path} is a binary file and can't be edited here.</p>
            )}
          </div>
        )}

        {!node && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="max-w-xs">
              <Code2 size={40} className="mx-auto mb-3 text-ws-accent" strokeWidth={1.4} />
              <h3 className="text-sm font-semibold">No file open</h3>
              <p className="mt-1 text-xs leading-relaxed text-ws-muted">
                Pick a file in the Explorer to start editing. Press <kbd className="rounded border border-ws-border px-1">Ctrl</kbd>+<kbd className="rounded border border-ws-border px-1">B</kbd> to toggle the sidebar.
              </p>
            </div>
          </div>
        )}
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={tabMenu(menu.path)} onClose={() => setMenu(null)} />}
    </div>
  );
}
