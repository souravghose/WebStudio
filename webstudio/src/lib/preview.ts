import type { ProjectNode } from '../types';
import { dirname, resolvePath, mimeFor } from './paths';

export interface PreviewSegment {
  file: string;
  /** 1-based line in the generated document where this file's first line sits */
  startLine: number;
  lineCount: number;
}

export interface PreviewBuild {
  html: string;
  segments: PreviewSegment[];
  missing: string[];
}

/** The script injected into the sandboxed iframe. Talks to the parent only via postMessage. */
function bridgeScript(token: string): string {
  return `(function(){
var T=${JSON.stringify(token)};
function post(m){m.__webstudio=T;try{parent.postMessage(m,'*')}catch(e){}}
function fmt(v,d){
  d=d||0;
  if(v===undefined)return 'undefined';
  if(v===null)return 'null';
  var t=typeof v;
  if(t==='string')return d?JSON.stringify(v):v;
  if(t==='function')return '[Function'+(v.name?': '+v.name:'')+']';
  if(t==='symbol'||t==='bigint')return String(v);
  if(t!=='object')return String(v);
  if(v instanceof Error)return v.stack||(v.name+': '+v.message);
  if(typeof Node!=='undefined'&&v instanceof Node)return '<'+(v.nodeName||'node').toLowerCase()+'>';
  if(d>3)return Array.isArray(v)?'[Array]':'[Object]';
  try{
    if(Array.isArray(v))return '['+v.slice(0,50).map(function(x){return fmt(x,d+1)}).join(', ')+(v.length>50?', …':'')+']';
    var keys=Object.keys(v).slice(0,50);
    return '{'+keys.map(function(k){return k+': '+fmt(v[k],d+1)}).join(', ')+'}';
  }catch(e){return Object.prototype.toString.call(v)}
}
['log','info','warn','error','debug'].forEach(function(k){
  var old=console[k];
  console[k]=function(){
    var args=Array.prototype.slice.call(arguments);
    post({type:'console',level:k,text:args.map(function(a){return fmt(a,0)}).join(' ')});
    try{old.apply(console,args)}catch(e){}
  };
});
var oldClear=console.clear;
console.clear=function(){post({type:'clear'});try{oldClear.call(console)}catch(e){}};
window.addEventListener('error',function(e){
  post({type:'runtime-error',message:e.message||'Script error',file:e.filename||'',line:e.lineno||0,column:e.colno||0});
});
window.addEventListener('unhandledrejection',function(e){
  post({type:'runtime-error',message:'Unhandled promise rejection: '+fmt(e.reason,0),file:'',line:0,column:0});
});
window.addEventListener('message',function(e){
  if(e.source!==parent)return;
  var d=e.data;
  if(!d||d.__webstudio!==T||d.type!=='eval')return;
  try{var r=(0,eval)(d.code);post({type:'console',level:'result',text:fmt(r,1)})}
  catch(err){post({type:'console',level:'error',text:fmt(err,0)})}
});
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
  if(!a)return;
  var h=a.getAttribute('href')||'';
  if(!h||h.charAt(0)==='#'||/^[a-z][a-z0-9+.-]*:/i.test(h)||h.slice(0,2)==='//')return;
  e.preventDefault();
  post({type:'navigate',href:h});
},true);
})();`;
}

const escapeScript = (s: string) => s.replace(/<\/(script)/gi, '<\\/$1');
const escapeStyle = (s: string) => s.replace(/<\/(style)/gi, '<\\/$1');
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#|data:)/i;

function toDataUrl(n: ProjectNode): string {
  return n.binary ? n.content : `data:${mimeFor(n.path)};charset=utf-8,${encodeURIComponent(n.content)}`;
}

function inlineCssUrls(css: string, baseDir: string, files: Map<string, ProjectNode>): string {
  return css.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/gi, (full, q: string, ref: string) => {
    if (EXTERNAL.test(ref)) return full;
    const n = files.get(resolvePath(baseDir, ref));
    return n ? `url(${q}${toDataUrl(n)}${q})` : full;
  });
}

/**
 * Combine the project's files into one self-contained HTML document for a sandboxed srcdoc iframe.
 *  - <link rel="stylesheet" href="x.css"> and <script src="x.js"> are inlined from project files
 *  - src/href/poster/url() references to project assets (images, fonts, media) become data: URLs
 *  - user script contents are never rewritten, so what runs is exactly what was written
 */
export function buildPreview(nodes: ProjectNode[], entry: string, token: string): PreviewBuild {
  const files = new Map(nodes.filter((n) => n.type === 'file').map((n) => [n.path, n]));
  const missing: string[] = [];
  const base = dirname(entry);
  let html = files.get(entry)?.content ?? '';

  const lookup = (ref: string): ProjectNode | undefined => {
    if (EXTERNAL.test(ref)) return undefined;
    const p = resolvePath(base, ref);
    const n = files.get(p);
    if (!n && /\.[a-z0-9]+$/i.test(p) && !/\.html?$/i.test(p)) missing.push(p);
    return n;
  };

  // 1. asset attributes — only inside the tags that can reference media, never inside <script>/<style> text
  html = html.replace(/<(img|source|video|audio|track|input|embed|image|use|link|a)\b[^>]*>/gi, (tag, name: string) => {
    const isLink = name.toLowerCase() === 'link';
    if (isLink && /rel\s*=\s*["']?stylesheet/i.test(tag)) return tag; // handled below
    return tag.replace(/\b(src|poster|href)\s*=\s*(["'])([^"']+)\2/gi, (full, attr: string, q: string, ref: string) => {
      if (attr.toLowerCase() === 'href' && /\.(html?|css|js)$/i.test(ref)) return full;
      const n = lookup(ref);
      if (!n || (!n.binary && !/\.svg$/i.test(n.path))) return full;
      return `${attr}=${q}${toDataUrl(n)}${q}`;
    });
  });

  // 2. inline <style> blocks may use url(assets/…); line count is preserved
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs: string, css: string) => `<style${attrs}>${inlineCssUrls(css, base, files)}</style>`);

  // 3. external stylesheets → <style>. Newlines are collapsed so later lines in the HTML don't shift.
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!m) return tag;
    const n = lookup(m[1]);
    if (!n || n.binary) return tag;
    const css = inlineCssUrls(n.content, dirname(n.path), files).replace(/\r?\n/g, ' ');
    return `<style data-ws-file="${n.path}">${escapeStyle(css)}</style>`;
  });

  // 4. external scripts → inline, tracking where each one lands for error-line mapping
  const markers: { marker: string; file: string; lines: number }[] = [];
  html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a: string, src: string, b: string) => {
    const n = lookup(src);
    if (!n || n.binary) return tag;
    const attrs = `${a} ${b}`.replace(/\s+/g, ' ').trim();
    const marker = `/*@@WS${markers.length}@@*/`;
    markers.push({ marker, file: n.path, lines: n.content.split('\n').length });
    return `<script${attrs ? ' ' + attrs : ''} data-ws-file="${n.path}">${marker}${escapeScript(n.content)}\n</script>`;
  });

  // 5. inject the console/error bridge as early as possible, on a single line (keeps line numbers stable)
  const bridge = `<script>${escapeScript(bridgeScript(token).replace(/\n\s*/g, ' '))}</script>`;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + bridge);
  else if (/<html[^>]*>/i.test(html)) html = html.replace(/<html[^>]*>/i, (m) => m + '<head>' + bridge + '</head>');
  else html = bridge + html;

  const docLines = html.split('\n');
  const segments: PreviewSegment[] = [];
  for (const m of markers) {
    const idx = docLines.findIndex((l) => l.includes(m.marker));
    if (idx >= 0) segments.push({ file: m.file, startLine: idx + 1, lineCount: m.lines });
  }
  return { html, segments, missing: [...new Set(missing)] };
}

/** Map a runtime error position in the generated document back to a project file and line. */
export function mapErrorLocation(segments: PreviewSegment[], entry: string, line: number): { file: string; line: number } {
  for (const s of segments) {
    if (line >= s.startLine && line < s.startLine + s.lineCount) return { file: s.file, line: line - s.startLine + 1 };
  }
  // Inline script inside the entry HTML: undo the lines added by external scripts inlined above it.
  const shift = segments.reduce((sum, s) => (line >= s.startLine + s.lineCount ? sum + s.lineCount : sum), 0);
  return { file: entry, line: Math.max(1, line - shift) };
}

/**
 * A standalone page for "open in new tab". The project still runs inside a sandboxed, origin-less
 * iframe, so imported code can never reach this app's storage even when opened full-page.
 */
export function buildStandalonePage(innerHtml: string, title: string): string {
  const escaped = innerHtml.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const safeTitle = title.replace(/[<>&"]/g, '');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>html,body{margin:0;height:100%;background:#fff}iframe{position:fixed;inset:0;width:100%;height:100%;border:0}</style></head><body><iframe sandbox="allow-scripts allow-forms allow-modals allow-popups" srcdoc="${escaped}"></iframe></body></html>`;
}
