import expand from 'emmet';
import type { editor as MonacoEditor } from 'monaco-editor';
import { monaco } from './monacoSetup';
import { cssDepth, extractCssAbbreviation, extractHtmlAbbreviation, pairAt, scanModel } from './editorUtils';
import { openQuickOpen } from './quickOpen';
import { startProjectIntelligence } from './projectIntel';

/**
 * Per-editor enhancements, installed from EditorArea's onMount:
 *  - Tab expands real Emmet abbreviations (HTML + CSS) and otherwise behaves exactly like normal Tab
 *  - matching open/close HTML tag highlighting
 *  - Ctrl+P (go to file) and Ctrl+Shift+P (command palette)
 * Multi-cursor (Alt+click, Ctrl+Alt+↑/↓, Ctrl+D, Ctrl+Shift+L, Shift+Alt+drag, Escape, …), line editing and
 * find/replace are Monaco's native, VS Code-identical commands, configured in EditorArea's options.
 */

startProjectIntelligence();

if (typeof document !== 'undefined' && !document.getElementById('ws-editor-features-css')) {
  const style = document.createElement('style');
  style.id = 'ws-editor-features-css';
  style.textContent = `
    .ws-tag-match { background: rgba(99, 102, 241, 0.28); border-radius: 2px; box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.55); }
  `;
  document.head.append(style);
}

/** `${1:placeholder}` style fields, which Monaco's snippet engine turns into tab stops. */
const field = (index: number, placeholder: string) => `\${${index}${placeholder ? ':' + placeholder : ''}}`;

type SnippetController = { insert(template: string, opts?: { overwriteBefore?: number; overwriteAfter?: number }): void };

function insertSnippet(editor: MonacoEditor.IStandaloneCodeEditor, template: string, overwriteBefore: number): boolean {
  const ctrl = editor.getContribution('snippetController2') as unknown as SnippetController | null;
  if (!ctrl) return false;
  editor.pushUndoStop();
  ctrl.insert(template, { overwriteBefore });
  editor.pushUndoStop();
  return true;
}

function tryExpandHtml(editor: MonacoEditor.IStandaloneCodeEditor, model: MonacoEditor.ITextModel, pos: { lineNumber: number; column: number }): boolean {
  const line = model.getLineContent(pos.lineNumber);
  const before = line.slice(0, pos.column - 1);
  const after = line.slice(pos.column - 1);
  if (after && !/^[\s<]/.test(after)) return false; // caret in the middle of a word

  const upto = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: pos.column }).toLowerCase();
  // inside <script> / <style>: not markup
  if (Math.max(upto.lastIndexOf('<script'), upto.lastIndexOf('<style')) > Math.max(upto.lastIndexOf('</script'), upto.lastIndexOf('</style'))) return false;
  // inside an unfinished tag / comment: not an abbreviation
  if (upto.lastIndexOf('<!--') > upto.lastIndexOf('-->')) return false;

  const abbr = extractHtmlAbbreviation(before);
  if (!abbr) return false;
  const source = abbr === '!' ? 'html:5' : abbr;

  const plainWord = /^[A-Za-z][A-Za-z0-9]*$/.test(source);
  if (plainWord && source !== source.toLowerCase()) return false; // `Hello` is text, not a tag

  let out: string;
  try {
    out = expand(source, { type: 'markup', syntax: 'html', options: { 'output.field': field } });
  } catch {
    return false; // not a valid abbreviation
  }
  if (!out) return false;
  // a plain word that Emmet only turned into a generic <word></word> element is just text, so Tab should indent
  if (plainWord && new RegExp(`^<${source}[\\s>/]`, 'i').test(out) && !KNOWN_TAGS.has(source.toLowerCase())) return false;
  return insertSnippet(editor, out, abbr.length);
}

function tryExpandCss(editor: MonacoEditor.IStandaloneCodeEditor, model: MonacoEditor.ITextModel, pos: { lineNumber: number; column: number }): boolean {
  const line = model.getLineContent(pos.lineNumber);
  const before = line.slice(0, pos.column - 1);
  const after = line.slice(pos.column - 1);
  if (after && !/^\s*\}/.test(after) && after.trim() !== '') return false;
  const text = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: pos.column });
  if (cssDepth(text) === 0) return false; // selectors / at-rules are not Emmet territory
  const abbr = extractCssAbbreviation(before);
  if (!abbr) return false;
  let out: string;
  try {
    out = expand(abbr, { type: 'stylesheet', syntax: 'css', options: { 'output.field': field } });
  } catch {
    return false;
  }
  if (!out) return false;
  return insertSnippet(editor, out, abbr.length);
}

/** Returns true when an Emmet abbreviation was expanded. */
export function tryExpandEmmet(editor: MonacoEditor.IStandaloneCodeEditor): boolean {
  const model = editor.getModel();
  const pos = editor.getPosition();
  if (!model || !pos) return false;
  const lang = model.getLanguageId();
  if (lang === 'html') return tryExpandHtml(editor, model, pos);
  if (lang === 'css') return tryExpandCss(editor, model, pos);
  return false;
}

const KNOWN_TAGS = new Set((
  'a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed ' +
  'fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript ' +
  'object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup svg table tbody td ' +
  'template textarea tfoot th thead time title tr track u ul var video wbr'
).split(' '));

export function installEditorFeatures(editor: MonacoEditor.IStandaloneCodeEditor) {
  const { KeyMod, KeyCode } = monaco;

  // --- Tab: Emmet expansion, otherwise the normal Tab behaviour (indent, snippet tab stops, accept suggestion).
  // The context excludes every case where Tab already means something else, so normal indentation,
  // snippet navigation and suggestion acceptance are untouched.
  editor.addCommand(
    KeyCode.Tab,
    () => {
      if (!tryExpandEmmet(editor)) editor.trigger('emmet', 'tab', null);
    },
    'editorTextFocus && !editorReadonly && !editorTabMovesFocus && !editorHasSelection && !editorHasMultipleSelections && !suggestWidgetVisible && !inSnippetMode && !inlineSuggestionVisible',
  );

  // --- Navigation: Ctrl+P go to file, Ctrl+Shift+P command palette (Monaco's own palette, also on F1)
  editor.addAction({
    id: 'webstudio.goToFile',
    label: 'Go to File…',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KeyP],
    run: () => openQuickOpen(),
  });
  editor.addAction({
    id: 'webstudio.commandPalette',
    label: 'Show Command Palette',
    keybindings: [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP],
    run: (ed) => void ed.getAction('editor.action.quickCommand')?.run(),
  });

  // --- Matching tag highlight (HTML)
  const decorations = editor.createDecorationsCollection();
  const highlight = () => {
    const model = editor.getModel();
    const pos = editor.getPosition();
    if (!model || !pos || model.getLanguageId() !== 'html' || editor.getSelections()?.length !== 1) {
      decorations.clear();
      return;
    }
    const hit = pairAt(scanModel(model).pairs, model.getOffsetAt(pos), false);
    if (!hit || !hit.pair.close) {
      decorations.clear();
      return;
    }
    const range = (t: { nameStart: number; nameEnd: number }) => {
      const a = model.getPositionAt(t.nameStart);
      const b = model.getPositionAt(t.nameEnd);
      return new monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column);
    };
    const options = { className: 'ws-tag-match', stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges };
    decorations.set([
      { range: range(hit.pair.open), options },
      { range: range(hit.pair.close), options },
    ]);
  };
  editor.onDidChangeCursorPosition(highlight);
  editor.onDidChangeModel(highlight);
  editor.onDidChangeModelContent(() => queueMicrotask(highlight));
  highlight();
}
