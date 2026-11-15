import * as monaco from 'monaco-editor';
import { emmetCSS, emmetHTML } from 'emmet-monaco-es';
import { cssDepth, pairAt, scanModel } from './editorUtils';
import { snippetsFor, type SnippetLang } from './snippets';

/**
 * Language-level editor intelligence, registered once when Monaco is set up:
 *  - real Emmet (emmet-monaco-es, built on the same engine as VS Code) for HTML and CSS
 *  - smart snippets (built-in + user-defined) for HTML / CSS / JavaScript
 *  - linked tag renaming for HTML (plugs into Monaco's native `linkedEditing`)
 *  - HTML structure diagnostics (unclosed / unexpected tags, duplicate ids and attributes)
 * Per-editor behaviour (Tab expansion, tag highlighting, shortcuts) lives in editorFeatures.ts.
 */

// Emmet must be initialised BEFORE any editor instance is created.
emmetHTML(monaco, ['html']);
emmetCSS(monaco, ['css']);

const fullTextBefore = (model: monaco.editor.ITextModel, pos: monaco.Position) =>
  model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: pos.column });

// ---------------------------------------------------------------- snippets
function registerSnippets(lang: SnippetLang) {
  monaco.languages.registerCompletionItemProvider(lang, {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn, endColumn: word.endColumn,
      };
      // never offer snippets right after a "." (member access) or "-" / "@" / "#" prefix characters
      if (word.startColumn > 1) {
        const prev = model.getValueInRange({ ...range, startColumn: word.startColumn - 1, endColumn: word.startColumn });
        if (prev === '.' && lang !== 'css') return { suggestions: [] };
        if (lang === 'javascript' && /[.$\w]/.test(prev)) return { suggestions: [] };
      }

      let htmlInsideTag = false;
      let depth = 0;
      if (lang === 'html') {
        const slice = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 40), startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column,
        });
        htmlInsideTag = slice.lastIndexOf('<') > slice.lastIndexOf('>');
      } else if (lang === 'css') {
        depth = cssDepth(fullTextBefore(model, position));
      }

      const suggestions: monaco.languages.CompletionItem[] = [];
      for (const s of snippetsFor(lang)) {
        if (lang === 'html' && htmlInsideTag) continue;
        if (lang === 'css' && ((s.when === 'block' && depth === 0) || (s.when === 'top' && depth > 0))) continue;
        suggestions.push({
          label: { label: s.prefix, description: 'snippet' },
          kind: monaco.languages.CompletionItemKind.Snippet,
          detail: s.description,
          documentation: { value: '```\n' + s.body.replace(/\$\{\d+(?::([^}]*))?\}|\$\d+|\$\{\d+\|([^,|}]*)[^}]*\}/g, (_m, p1, p2) => p1 ?? p2 ?? '') + '\n```' },
          insertText: s.body,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          filterText: s.prefix,
          sortText: '0_' + s.prefix,
          range,
        });
      }
      return { suggestions };
    },
  });
}
(['html', 'css', 'javascript'] as SnippetLang[]).forEach(registerSnippets);

// ---------------------------------------------------------------- tag renaming
// Registering our own provider makes Monaco's built-in `linkedEditing` option (the "Linked tag editing"
// setting) work reliably: edit <div> and </div> follows, and vice-versa. Only the tag *name* is linked,
// so attributes, text and unrelated tags are never touched.
monaco.languages.registerLinkedEditingRangeProvider('html', {
  provideLinkedEditingRanges(model, position) {
    const hit = pairAt(scanModel(model).pairs, model.getOffsetAt(position), true);
    if (!hit || !hit.pair.close) return null;
    const toRange = (t: { nameStart: number; nameEnd: number }) => {
      const a = model.getPositionAt(t.nameStart);
      const b = model.getPositionAt(t.nameEnd);
      return new monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column);
    };
    return { ranges: [toRange(hit.pair.open), toRange(hit.pair.close)], wordPattern: /[A-Za-z][\w:.-]*/ };
  },
});

// ---------------------------------------------------------------- HTML diagnostics
const MARKER_OWNER = 'webstudio-html';

function validateHtml(model: monaco.editor.ITextModel) {
  if (model.isDisposed()) return;
  const markers: monaco.editor.IMarkerData[] = scanModel(model).diagnostics.map((d) => {
    const a = model.getPositionAt(d.start);
    const b = model.getPositionAt(d.end);
    return {
      severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      message: d.message,
      source: 'html',
      startLineNumber: a.lineNumber, startColumn: a.column, endLineNumber: b.lineNumber, endColumn: b.column,
    };
  });
  monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
}

function watchModel(model: monaco.editor.ITextModel) {
  if (model.getLanguageId() !== 'html') return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => validateHtml(model), 500);
  };
  const sub = model.onDidChangeContent(schedule);
  const langSub = model.onDidChangeLanguage(() => {
    if (model.getLanguageId() !== 'html') monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
  });
  model.onWillDispose(() => {
    clearTimeout(timer);
    sub.dispose();
    langSub.dispose();
  });
  validateHtml(model);
}
monaco.editor.onDidCreateModel(watchModel);
monaco.editor.getModels().forEach(watchModel);
