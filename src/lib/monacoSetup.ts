import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Bundle Monaco with the app (no CDN needed — works offline and on GitHub Pages).
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case 'json': return new JsonWorker();
      case 'css': case 'scss': case 'less': return new CssWorker();
      case 'html': case 'handlebars': case 'razor': return new HtmlWorker();
      case 'typescript': case 'javascript': return new TsWorker();
      default: return new EditorWorker();
    }
  },
};

import { formatSource } from './format';
import './editorEnhancements'; // Emmet, snippets, tag renaming, HTML diagnostics
import type { EditorLang } from './paths';

loader.config({ monaco });

export const THEME = 'webstudio-dark';
export const THEME_LIGHT = 'webstudio-light';

monaco.editor.defineTheme(THEME, {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'tag', foreground: '7DD3FC' },
    { token: 'attribute.name', foreground: 'C4B5FD' },
    { token: 'attribute.value', foreground: 'FDBA74' },
    { token: 'keyword', foreground: 'A78BFA' },
    { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
    { token: 'string', foreground: 'FDBA74' },
    { token: 'number', foreground: '86EFAC' },
  ],
  colors: {
    'editor.background': '#0B1220',
    'editor.foreground': '#E5E7EB',
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#CBD5E1',
    'editor.lineHighlightBackground': '#111B2E',
    'editor.selectionBackground': '#6366F155',
    'editor.inactiveSelectionBackground': '#6366F122',
    'editorCursor.foreground': '#8B5CF6',
    'editorIndentGuide.background1': '#1E293B',
    'editorIndentGuide.activeBackground1': '#334155',
    'editorWidget.background': '#111827',
    'editorWidget.border': '#273244',
    'editorSuggestWidget.background': '#111827',
    'editorSuggestWidget.border': '#273244',
    'editorSuggestWidget.selectedBackground': '#1E2A44',
    'editorHoverWidget.background': '#111827',
    'editorHoverWidget.border': '#273244',
    'minimap.background': '#0B1220',
    'scrollbarSlider.background': '#27324480',
    'scrollbarSlider.hoverBackground': '#334155aa',
    'input.background': '#0B1220',
    'input.border': '#273244',
    'focusBorder': '#6366F1',
  },
});

monaco.editor.defineTheme(THEME_LIGHT, {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'tag', foreground: '0369A1' },
    { token: 'attribute.name', foreground: '6D28D9' },
    { token: 'attribute.value', foreground: 'B45309' },
    { token: 'keyword', foreground: '6D28D9' },
    { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
    { token: 'string', foreground: 'B45309' },
    { token: 'number', foreground: '047857' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#1F2937',
    'editorLineNumber.foreground': '#94A3B8',
    'editorLineNumber.activeForeground': '#334155',
    'editor.lineHighlightBackground': '#F1F5F9',
    'editor.selectionBackground': '#4F46E533',
    'editor.inactiveSelectionBackground': '#4F46E518',
    'editorCursor.foreground': '#4F46E5',
    'editorIndentGuide.background1': '#E2E8F0',
    'editorIndentGuide.activeBackground1': '#CBD5E1',
    'editorWidget.background': '#F8FAFC',
    'editorWidget.border': '#D8DEE9',
    'editorSuggestWidget.background': '#FFFFFF',
    'editorSuggestWidget.border': '#D8DEE9',
    'editorSuggestWidget.selectedBackground': '#E0E7FF',
    'editorHoverWidget.background': '#FFFFFF',
    'editorHoverWidget.border': '#D8DEE9',
    'minimap.background': '#FFFFFF',
    'scrollbarSlider.background': '#94A3B866',
    'scrollbarSlider.hoverBackground': '#64748B88',
    'input.background': '#FFFFFF',
    'input.border': '#D8DEE9',
    'focusBorder': '#4F46E5',
  },
});

// JavaScript language service: syntax + basic semantic validation, browser globals available.
const ts = monaco.languages.typescript;
ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
ts.javascriptDefaults.setCompilerOptions({
  target: ts.ScriptTarget.ES2020,
  allowNonTsExtensions: true,
  allowJs: true,
  checkJs: false,
  lib: ['es2020', 'dom', 'dom.iterable'],
});

// Use Prettier for "Format Document" (context menu / command palette), same as the toolbar button.
const formattable: [string, EditorLang][] = [
  ['html', 'html'], ['css', 'css'], ['javascript', 'javascript'], ['json', 'json'], ['markdown', 'markdown'],
];
for (const [id, lang] of formattable) {
  monaco.languages.registerDocumentFormattingEditProvider(id, {
    async provideDocumentFormattingEdits(model, options) {
      try {
        const text = await formatSource(model.getValue(), lang, options.tabSize);
        return [{ range: model.getFullModelRange(), text }];
      } catch {
        return []; // syntax errors: leave the document untouched, Problems panel shows why
      }
    },
  });
}

export { monaco };
