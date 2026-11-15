import type { ProjectNode } from '../types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const basename = (p: string) => p.slice(p.lastIndexOf('/') + 1);
export const dirname = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
export const extname = (p: string) => {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i <= 0 ? '' : b.slice(i + 1).toLowerCase();
};
export const joinPath = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '');

/** Resolve "./a/../b.css" style references against a base directory. */
export function resolvePath(base: string, ref: string): string {
  const clean = ref.split('#')[0].split('?')[0];
  const parts = (clean.startsWith('/') ? clean.slice(1) : joinPath(base, clean)).split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

export function validateName(name: string): string | null {
  const n = name.trim();
  if (!n) return 'Name cannot be empty.';
  if (/[\\:*?"<>|#%]/.test(n)) return 'Name contains invalid characters (\\ : * ? " < > | # %).';
  if (n === '.' || n === '..') return 'Invalid name.';
  return null;
}

const TEXT_EXT = new Set([
  'html', 'htm', 'css', 'js', 'mjs', 'jsx', 'ts', 'tsx', 'json', 'md', 'txt', 'svg', 'xml', 'csv', 'yml', 'yaml', 'map', 'gitignore',
]);
const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
  ico: 'image/x-icon', svg: 'image/svg+xml', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
};

export const isTextFile = (p: string) => TEXT_EXT.has(extname(p)) || !extname(p);
export const mimeFor = (p: string) => MIME[extname(p)] ?? 'application/octet-stream';
export const isImage = (p: string) => mimeFor(p).startsWith('image/');

export type EditorLang = 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown' | 'plaintext' | 'xml';
export function languageFor(p: string): EditorLang {
  switch (extname(p)) {
    case 'html': case 'htm': return 'html';
    case 'css': return 'css';
    case 'js': case 'mjs': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'json': case 'map': return 'json';
    case 'md': return 'markdown';
    case 'svg': case 'xml': return 'xml';
    default: return 'plaintext';
  }
}

export function sortNodes(nodes: ProjectNode[]): ProjectNode[] {
  return [...nodes].sort((a, b) => {
    const ad = dirname(a.path), bd = dirname(b.path);
    if (ad === bd) {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return basename(a.path).localeCompare(basename(b.path), undefined, { numeric: true });
    }
    return a.path.localeCompare(b.path);
  });
}

export function uniquePath(nodes: ProjectNode[], desired: string): string {
  const taken = new Set(nodes.map((n) => n.path.toLowerCase()));
  if (!taken.has(desired.toLowerCase())) return desired;
  const dir = dirname(desired);
  const base = basename(desired);
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  for (let i = 2; i < 1000; i++) {
    const candidate = joinPath(dir, `${stem}-${i}${ext}`);
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return desired + '-' + uid();
}

/** Ensure every ancestor folder of every node exists as an explicit folder node. */
export function withParentFolders(nodes: ProjectNode[]): ProjectNode[] {
  const have = new Set(nodes.map((n) => n.path));
  const out = [...nodes];
  for (const n of nodes) {
    let dir = dirname(n.path);
    while (dir) {
      if (!have.has(dir)) {
        have.add(dir);
        out.push({ path: dir, type: 'folder', content: '' });
      }
      dir = dirname(dir);
    }
  }
  return out;
}

export interface TreeItem {
  node: ProjectNode;
  name: string;
  children: TreeItem[];
}

export function buildTree(nodes: ProjectNode[]): TreeItem[] {
  const sorted = sortNodes(withParentFolders(nodes));
  const map = new Map<string, TreeItem>();
  const roots: TreeItem[] = [];
  for (const node of sorted) map.set(node.path, { node, name: basename(node.path), children: [] });
  for (const node of sorted) {
    const item = map.get(node.path)!;
    const parent = map.get(dirname(node.path));
    (parent ? parent.children : roots).push(item);
  }
  const order = (items: TreeItem[]) => {
    items.sort((a, b) => {
      if (a.node.type !== b.node.type) return a.node.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    items.forEach((i) => order(i.children));
  };
  order(roots);
  return roots;
}

export const slug = (s: string) => s.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'project';

export const formatTime = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
