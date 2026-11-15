import type { editor } from 'monaco-editor';

/**
 * Pure helpers shared by the editor enhancements (HTML tag scanner, Emmet abbreviation extraction,
 * CSS brace depth). They have no Monaco runtime dependency so they are easy to reason about and test.
 */

export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** Elements whose end tag may legally be omitted – never reported as "unclosed". */
const OPTIONAL_END = new Set([
  'p', 'li', 'dt', 'dd', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'option', 'optgroup', 'colgroup', 'html', 'head', 'body',
]);

export interface TagInfo {
  name: string;
  /** offsets into the document text */
  start: number;
  end: number;
  nameStart: number;
  nameEnd: number;
}

export interface TagPair {
  open: TagInfo;
  close: TagInfo | null;
}

export interface HtmlDiagnostic {
  start: number;
  end: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ScanResult {
  pairs: TagPair[];
  diagnostics: HtmlDiagnostic[];
}

const TAG_RE = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g;

/** Scan HTML text: tag pairs (for matching / renaming) plus structural diagnostics. */
export function scanHtml(text: string): ScanResult {
  const pairs: TagPair[] = [];
  const diagnostics: HtmlDiagnostic[] = [];
  const stack: { info: TagInfo; pair: TagPair }[] = [];
  const ids = new Map<string, number>();
  const lower = text.toLowerCase();
  const re = new RegExp(TAG_RE.source, 'g');
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    if (m[2] === undefined) continue; // comment / CDATA
    const closing = m[1] === '/';
    const name = m[2];
    const lname = name.toLowerCase();
    const nameStart = m.index + 1 + (closing ? 1 : 0);
    const info: TagInfo = { name, start: m.index, end: m.index + m[0].length, nameStart, nameEnd: nameStart + name.length };

    if (!closing) {
      let attrs = m[3];
      const selfClosing = /\/\s*$/.test(attrs);
      if (selfClosing) attrs = attrs.replace(/\/\s*$/, '');
      const attrsStart = info.nameEnd;

      // duplicate attributes / duplicate ids
      const seen = new Set<string>();
      const am = new RegExp(ATTR_RE.source, 'g');
      let a: RegExpExecArray | null;
      while ((a = am.exec(attrs))) {
        const an = a[1].toLowerCase();
        const abs = attrsStart + a.index;
        if (seen.has(an)) {
          diagnostics.push({ start: abs, end: abs + a[1].length, severity: 'warning', message: `Duplicate attribute "${a[1]}".` });
        }
        seen.add(an);
        if (an === 'id') {
          const val = a[2] ?? a[3] ?? a[4] ?? '';
          if (val && !/[{}<>]/.test(val)) {
            const vStart = abs + a[0].indexOf(val, a[1].length);
            if (ids.has(val)) diagnostics.push({ start: vStart, end: vStart + val.length, severity: 'warning', message: `Duplicate id "${val}".` });
            else ids.set(val, vStart);
          }
        }
      }

      if (VOID_ELEMENTS.has(lname) || selfClosing) {
        pairs.push({ open: info, close: null });
      } else {
        // <li> directly after <li> (etc.) implicitly closes the previous one
        const top = stack[stack.length - 1];
        if (top && top.info.name.toLowerCase() === lname && OPTIONAL_END.has(lname)) stack.pop();
        const pair: TagPair = { open: info, close: null };
        pairs.push(pair);
        stack.push({ info, pair });
        if (lname === 'script' || lname === 'style') {
          const idx = lower.indexOf('</' + lname, re.lastIndex);
          if (idx >= 0) re.lastIndex = idx; // never parse JS/CSS as markup
        }
      }
    } else {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].info.name.toLowerCase() !== lname) i--;
      if (i < 0) {
        diagnostics.push({
          start: info.start, end: info.end, severity: 'error',
          message: VOID_ELEMENTS.has(lname) ? `<${name}> is a void element and has no closing tag.` : `Unexpected closing tag </${name}>.`,
        });
      } else {
        for (let j = stack.length - 1; j > i; j--) {
          const inner = stack[j].info;
          if (!OPTIONAL_END.has(inner.name.toLowerCase())) {
            diagnostics.push({ start: inner.start, end: inner.nameEnd, severity: 'error', message: `<${inner.name}> is not closed before </${name}>.` });
          }
        }
        stack[i].pair.close = info;
        stack.length = i;
      }
    }
  }

  for (const s of stack) {
    if (!OPTIONAL_END.has(s.info.name.toLowerCase())) {
      diagnostics.push({ start: s.info.start, end: s.info.nameEnd, severity: 'warning', message: `<${s.info.name}> has no closing tag.` });
    }
  }
  return { pairs, diagnostics };
}

const scanCache = new WeakMap<editor.ITextModel, { version: number; result: ScanResult }>();

/** scanHtml(), cached per model version so cursor movement never re-parses an unchanged file. */
export function scanModel(model: editor.ITextModel): ScanResult {
  const version = model.getVersionId();
  const hit = scanCache.get(model);
  if (hit && hit.version === version) return hit.result;
  const result = scanHtml(model.getValue());
  scanCache.set(model, { version, result });
  return result;
}

/** The tag pair whose open or close tag contains `offset`. `nameOnly` restricts to the tag-name span. */
export function pairAt(pairs: TagPair[], offset: number, nameOnly: boolean): { pair: TagPair; inOpen: boolean } | null {
  let best: { pair: TagPair; inOpen: boolean } | null = null;
  for (const pair of pairs) {
    if (!pair.close) continue;
    const o = pair.open, c = pair.close;
    const inOpen = nameOnly ? offset >= o.nameStart && offset <= o.nameEnd : offset >= o.start && offset <= o.end;
    const inClose = nameOnly ? offset >= c.nameStart && offset <= c.nameEnd : offset >= c.start && offset <= c.end;
    if ((inOpen || inClose) && (!best || o.start > best.pair.open.start)) best = { pair, inOpen };
  }
  return best;
}

/** Net `{` nesting depth of CSS text (comments and strings ignored). */
export function cssDepth(text: string): number {
  const t = text.replace(/\/\*[\s\S]*?(\*\/|$)/g, '').replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '');
  let d = 0;
  for (const ch of t) {
    if (ch === '{') d++;
    else if (ch === '}') d = Math.max(0, d - 1);
  }
  return d;
}

/**
 * Find the Emmet abbreviation that ends at the end of `before` (the text of the line left of the caret).
 * Returns null when the caret is inside a tag or no abbreviation precedes it.
 */
export function extractHtmlAbbreviation(before: string): string | null {
  // start after the last complete tag on the line, e.g. `<ul>li*3` -> `li*3`
  let from = 0;
  const tagRe = /<\/?[A-Za-z][^<>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(before))) from = m.index + m[0].length;
  const rem = before.slice(from);
  if (rem.includes('<')) return null; // caret is inside an unfinished tag
  let i = rem.length;
  let depth = 0;
  while (i > 0) {
    const ch = rem[i - 1];
    if (ch === ']' || ch === '}' || ch === ')') depth++;
    else if (ch === '[' || ch === '{' || ch === '(') {
      if (depth === 0) break;
      depth--;
    } else if (/\s/.test(ch) && depth === 0) break;
    i--;
  }
  const abbr = rem.slice(i);
  return abbr || null;
}

/** Abbreviation (property + value) at the end of a CSS line, e.g. `m10`, `d:f`, `jc:c`. */
export function extractCssAbbreviation(before: string): string | null {
  const m = /[^\s;{}]+$/.exec(before);
  if (!m) return null;
  const abbr = m[0];
  if (!/^-?[a-z]/i.test(abbr)) return null;
  // a bare value after "prop:" (e.g. `color: red`) is not an abbreviation
  if (/:\s*$/.test(before.slice(0, before.length - abbr.length))) return null;
  return abbr;
}
