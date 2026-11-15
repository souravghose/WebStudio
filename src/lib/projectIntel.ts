import * as monaco from 'monaco-editor';
import { useStore, selectProject } from '../store/useStore';
import { cssDepth } from './editorUtils';

/**
 * Project-aware suggestions.
 *  - JavaScript: every project .js file that is not open in the editor is registered with the TypeScript
 *    language service (as an extra lib) so functions/variables from other files show up in completions.
 *    Open files are already visible to the service as models, so they are skipped (no duplicates).
 *  - CSS: custom properties (--vars) inside var(...), and class / id names in selectors.
 *  - HTML: class="" and id="" values suggested from the project's CSS and markup.
 */

const libs = new Map<string, { content: string; disposable: monaco.IDisposable }>();
let cssVars: string[] = [];
let classNames: string[] = [];
let idNames: string[] = [];

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
const ext = (p: string) => p.slice(p.lastIndexOf('.') + 1).toLowerCase();

function sync() {
  const project = selectProject(useStore.getState());
  const wanted = new Map<string, string>();
  const vars = new Set<string>();
  const classes = new Set<string>();
  const ids = new Set<string>();

  if (project) {
    const openPaths = new Set(monaco.editor.getModels().map((m) => m.uri.path));
    const prefix = `/${project.id}/`;
    for (const n of project.nodes) {
      if (n.type !== 'file' || n.binary || !n.content) continue;
      const e = ext(n.path);
      if (e === 'js' || e === 'mjs') {
        if (!openPaths.has(prefix + n.path)) wanted.set(`file:///webstudio-project/${project.id}/${n.path}`, n.content);
      }
      if (e === 'css') {
        const css = stripComments(n.content);
        for (const v of css.matchAll(/(--[\w-]+)\s*:/g)) vars.add(v[1]);
        for (const sel of css.matchAll(/([^{}]+)\{/g)) {
          for (const c of sel[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(c[1]);
          for (const i of sel[1].matchAll(/#(-?[_a-zA-Z][\w-]*)/g)) ids.add(i[1]);
        }
      } else if (e === 'html' || e === 'htm') {
        const html = stripComments(n.content);
        for (const v of html.matchAll(/(--[\w-]+)\s*:/g)) vars.add(v[1]);
        for (const c of html.matchAll(/\bclass\s*=\s*"([^"]*)"/gi)) c[1].split(/\s+/).filter((x) => /^-?[_a-zA-Z][\w-]*$/.test(x)).forEach((x) => classes.add(x));
        for (const i of html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)) ids.add(i[1]);
      }
    }
  }
  cssVars = [...vars].sort();
  classNames = [...classes].sort();
  idNames = [...ids].sort();

  const js = monaco.languages.typescript.javascriptDefaults;
  for (const [key, entry] of libs) {
    if (wanted.get(key) !== entry.content) {
      entry.disposable.dispose();
      libs.delete(key);
    }
  }
  for (const [key, content] of wanted) {
    if (!libs.has(key)) libs.set(key, { content, disposable: js.addExtraLib(content, key) });
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(sync, 600);
};

const lineBefore = (model: monaco.editor.ITextModel, pos: monaco.Position) => model.getValueInRange({
  startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: pos.column,
});

function items(names: string[], kind: monaco.languages.CompletionItemKind, range: monaco.IRange, detail: string): monaco.languages.CompletionItem[] {
  return names.map((name) => ({ label: name, kind, insertText: name, detail, range, sortText: '1_' + name }));
}

let started = false;
export function startProjectIntelligence() {
  if (started) return;
  started = true;

  useStore.subscribe(schedule);
  monaco.editor.onDidCreateModel(schedule);
  monaco.editor.onWillDisposeModel(schedule);
  sync();

  monaco.languages.registerCompletionItemProvider('css', {
    triggerCharacters: ['.', '#', '(', '-'],
    provideCompletionItems(model, position) {
      const before = lineBefore(model, position);
      const rangeFor = (len: number): monaco.IRange => ({
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column - len, endColumn: position.column,
      });
      const v = /var\(\s*([\w-]*)$/.exec(before);
      if (v) return { suggestions: items(cssVars, monaco.languages.CompletionItemKind.Variable, rangeFor(v[1].length), 'Project CSS variable') };
      const s = /(?:^|[\s,>+~])([.#])([\w-]*)$/.exec(before);
      if (s) {
        const text = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
        if (cssDepth(text) === 0) {
          return s[1] === '.'
            ? { suggestions: items(classNames, monaco.languages.CompletionItemKind.Class, rangeFor(s[2].length), 'Class in project') }
            : { suggestions: items(idNames, monaco.languages.CompletionItemKind.Reference, rangeFor(s[2].length), 'ID in project') };
        }
      }
      return { suggestions: [] };
    },
  });

  monaco.languages.registerCompletionItemProvider('html', {
    triggerCharacters: [' ', '"', "'"],
    provideCompletionItems(model, position) {
      const before = lineBefore(model, position);
      const cls = /\bclass\s*=\s*(["'])([^"']*)$/i.exec(before);
      const id = !cls ? /\bid\s*=\s*(["'])([^"']*)$/i.exec(before) : null;
      const hit = cls ?? id;
      if (!hit) return { suggestions: [] };
      const token = hit[2].split(/\s+/).pop() ?? '';
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column - token.length, endColumn: position.column,
      };
      return cls
        ? { suggestions: items(classNames, monaco.languages.CompletionItemKind.Class, range, 'Class in project') }
        : { suggestions: items(idNames, monaco.languages.CompletionItemKind.Reference, range, 'ID in project') };
    },
  });
}
