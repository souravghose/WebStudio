import type { editor as MonacoEditor } from 'monaco-editor';

/**
 * A tiny module-level bridge so UI outside the editor component (top bar, search panel,
 * problems list, console) can drive the active Monaco instance without prop drilling.
 */
let current: MonacoEditor.IStandaloneCodeEditor | null = null;
let pendingReveal: { line: number; column: number } | null = null;

export const editorBridge = {
  set(editor: MonacoEditor.IStandaloneCodeEditor | null) {
    current = editor;
    if (editor && pendingReveal) {
      const p = pendingReveal;
      pendingReveal = null;
      this.reveal(p.line, p.column);
    }
  },
  get: () => current,
  focus: () => current?.focus(),
  undo() {
    current?.focus();
    current?.trigger('toolbar', 'undo', null);
  },
  redo() {
    current?.focus();
    current?.trigger('toolbar', 'redo', null);
  },
  find() {
    current?.focus();
    current?.getAction('actions.find')?.run();
  },
  replace() {
    current?.focus();
    current?.getAction('editor.action.startFindReplace')?.run();
  },
  /** Reveal a line; if the editor isn't ready yet (file still opening) retry when it is. */
  reveal(line: number, column = 1) {
    if (!current) {
      pendingReveal = { line, column };
      return;
    }
    const ed = current;
    // wait a tick so a newly-selected model is attached
    setTimeout(() => {
      ed.revealLineInCenter(line);
      ed.setPosition({ lineNumber: line, column });
      ed.focus();
    }, 30);
  },
};

/** Lets the console REPL talk to the preview iframe. */
let previewWindow: Window | null = null;
let previewToken = '';
export const previewBridge = {
  register(win: Window | null, token: string) {
    previewWindow = win;
    previewToken = token;
  },
  evaluate(code: string): boolean {
    if (!previewWindow) return false;
    previewWindow.postMessage({ __webstudio: previewToken, type: 'eval', code }, '*');
    return true;
  },
};
