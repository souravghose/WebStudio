import { useStore, selectProject } from '../store/useStore';
import { editorBridge } from './editorBridge';

/** Ctrl+P "Go to file" palette: fuzzy-search every text/binary file in the current project. */

let overlay: HTMLElement | null = null;

/** Subsequence match score; higher is better, -1 means no match. Favours file-name and contiguous hits. */
function score(query: string, path: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const p = path.toLowerCase();
  const nameStart = p.lastIndexOf('/') + 1;
  let qi = 0;
  let s = 0;
  let prev = -2;
  for (let i = 0; i < p.length && qi < q.length; i++) {
    if (p[i] === q[qi]) {
      s += 1;
      if (i === prev + 1) s += 3; // contiguous
      if (i === nameStart || p[i - 1] === '/' || p[i - 1] === '-' || p[i - 1] === '_' || p[i - 1] === '.') s += 2; // word start
      if (i >= nameStart) s += 1; // inside the file name
      prev = i;
      qi++;
    }
  }
  if (qi < q.length) return -1;
  if (p.slice(nameStart).includes(q)) s += 10;
  return s - p.length * 0.01;
}

export function closeQuickOpen(refocus = true) {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  if (refocus) editorBridge.focus();
}

export function openQuickOpen() {
  if (overlay) return;
  const st = useStore.getState();
  const project = selectProject(st);
  if (!project) return;

  const files = project.nodes.filter((n) => n.type === 'file').map((n) => n.path);
  const recent = st.openTabs;
  const el = (tag: string, css: string) => {
    const e = document.createElement(tag);
    e.style.cssText = css;
    return e;
  };

  overlay = el('div', 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.45);display:flex;justify-content:center;align-items:flex-start;padding-top:14vh;');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Go to file');
  const box = el('div', 'width:min(560px,92vw);background:rgb(var(--ws-panel));color:rgb(var(--ws-text));border:1px solid rgb(var(--ws-border));border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.45);overflow:hidden;font-size:13px;');
  const input = el('input', 'width:100%;box-sizing:border-box;padding:11px 14px;background:transparent;color:inherit;border:0;border-bottom:1px solid rgb(var(--ws-border));outline:none;font:inherit;') as HTMLInputElement;
  input.placeholder = 'Go to file… (type to search)';
  input.setAttribute('aria-label', 'Search files');
  const list = el('div', 'max-height:50vh;overflow:auto;padding:4px 0;');
  list.setAttribute('role', 'listbox');
  box.append(input, list);
  overlay.append(box);
  document.body.append(overlay);

  let results: string[] = [];
  let active = 0;

  const choose = (path: string | undefined) => {
    if (!path) return;
    closeQuickOpen(false);
    useStore.getState().openFile(path);
    setTimeout(() => editorBridge.focus(), 50);
  };

  const render = () => {
    const q = input.value.trim();
    results = (q
      ? files.map((p) => ({ p, s: score(q, p) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).map((x) => x.p)
      : [...files].sort((a, b) => {
          const ra = recent.indexOf(a), rb = recent.indexOf(b);
          return (ra < 0 ? 1e9 : ra) - (rb < 0 ? 1e9 : rb) || a.localeCompare(b);
        })
    ).slice(0, 60);
    active = Math.min(active, Math.max(0, results.length - 1));
    list.textContent = '';
    if (!results.length) {
      const none = el('div', 'padding:10px 14px;color:rgb(var(--ws-muted));');
      none.textContent = 'No matching files';
      list.append(none);
      return;
    }
    results.forEach((path, i) => {
      const slash = path.lastIndexOf('/');
      const row = el('div', `display:flex;gap:8px;align-items:baseline;padding:6px 14px;cursor:pointer;${i === active ? 'background:rgb(var(--ws-hover));' : ''}`);
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(i === active));
      const name = el('span', 'font-weight:600;');
      name.textContent = path.slice(slash + 1);
      const dir = el('span', 'color:rgb(var(--ws-muted));font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
      dir.textContent = slash >= 0 ? path.slice(0, slash) : '';
      row.append(name, dir);
      row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        choose(path);
      });
      row.addEventListener('mousemove', () => {
        if (active !== i) {
          active = i;
          render();
        }
      });
      list.append(row);
    });
    (list.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(results.length - 1, active + 1);
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(0, active - 1);
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeQuickOpen();
    }
  });
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeQuickOpen();
  });

  render();
  input.focus();
}
