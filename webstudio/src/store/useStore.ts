import { create } from 'zustand';
import type {
  BottomTab, ConsoleEntry, Device, Layout, LogLevel, OutputEntry, Problem, Project, ProjectNode,
  SaveStatus, Settings, SidebarView,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { db } from '../lib/db';
import { getTemplate } from '../lib/templates';
import { legacyAlreadyMigrated, markLegacyMigrated, readLegacyProjects } from '../lib/legacy';
import {
  basename, dirname, joinPath, resolvePath, uid, uniquePath, validateName, withParentFolders,
} from '../lib/paths';
import { readFileAsNode, readZip } from '../lib/zip';

export type Dialog =
  | { kind: 'confirm'; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }
  | {
      kind: 'prompt'; title: string; label: string; initial?: string; confirmLabel?: string;
      validate?: (v: string) => string | null; onSubmit: (v: string) => void;
    }
  | { kind: 'shortcuts' }
  | { kind: 'about' };

interface UiPrefs {
  currentId?: string | null;
  settings: Settings;
  layout: Layout;
  sidebarView: SidebarView;
  sidebarVisible: boolean;
  bottomVisible: boolean;
  bottomTab: BottomTab;
  device: Device;
  editorRatio: number;
  sidebarWidth: number;
  bottomHeight: number;
}

const UI_KEY = 'webstudio.ui.v2';
const defaultPrefs: UiPrefs = {
  currentId: null,
  settings: DEFAULT_SETTINGS,
  layout: 'split',
  sidebarView: 'explorer',
  sidebarVisible: true,
  bottomVisible: true,
  bottomTab: 'console',
  device: 'desktop',
  editorRatio: 0.5,
  sidebarWidth: 260,
  bottomHeight: 200,
};

function loadPrefs(): UiPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
    return { ...defaultPrefs, ...raw, settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) } };
  } catch {
    return defaultPrefs;
  }
}

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('webstudio') : null;
export function onProjectSaved(cb: (projectId: string) => void): () => void {
  if (!channel) return () => undefined;
  const handler = (e: MessageEvent) => {
    if (e.data?.type === 'saved') cb(e.data.projectId);
  };
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
}

let logId = 1;
let outId = 1;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let initStarted = false;

interface State extends UiPrefs {
  ready: boolean;
  projects: Project[];
  openTabs: string[];
  activePath: string | null;
  dirty: Record<string, boolean>;
  saveStatus: SaveStatus;
  previewPath: string;
  previewNonce: number;
  logs: ConsoleEntry[];
  problems: Problem[];
  output: OutputEntry[];
  dialog: Dialog | null;
  expanded: Record<string, boolean>;
  searchFocusTick: number;
  revealTarget: { path: string; line: number; column: number; tick: number } | null;

  init: () => Promise<void>;
  // project management
  createProject: (name: string, templateId?: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  importZip: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
  saveNow: () => Promise<void>;
  // files
  createFile: (path: string, content?: string) => string | null;
  createFolder: (path: string) => string | null;
  renameNode: (path: string, newName: string) => string | null;
  deleteNode: (path: string) => void;
  moveNode: (path: string, targetFolder: string) => void;
  updateContent: (path: string, content: string) => void;
  importFiles: (files: File[], folder?: string) => Promise<void>;
  replaceInFiles: (replacements: { path: string; content: string }[]) => void;
  // tabs
  openFile: (path: string, line?: number, column?: number) => void;
  closeTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  setActive: (path: string) => void;
  toggleFolder: (path: string, force?: boolean) => void;
  collapseAll: () => void;
  // ui
  setLayout: (l: Layout) => void;
  setSidebarView: (v: SidebarView) => void;
  toggleSidebar: (force?: boolean) => void;
  toggleBottom: (force?: boolean) => void;
  setBottomTab: (t: BottomTab) => void;
  setDevice: (d: Device) => void;
  setEditorRatio: (r: number) => void;
  setSidebarWidth: (w: number) => void;
  setBottomHeight: (h: number) => void;
  updateSettings: (s: Partial<Settings>) => void;
  focusSearch: () => void;
  openDialog: (d: Dialog) => void;
  closeDialog: () => void;
  // preview + console
  refreshPreview: () => void;
  navigatePreview: (href: string) => void;
  addLog: (level: LogLevel, text: string, loc?: { file?: string; line?: number; column?: number }) => void;
  clearLogs: () => void;
  setProblems: (p: Problem[]) => void;
  addOutput: (kind: OutputEntry['kind'], text: string) => void;
  clearOutput: () => void;
}

const prefsOf = (s: State): UiPrefs => ({
  currentId: s.currentId, settings: s.settings, layout: s.layout, sidebarView: s.sidebarView,
  sidebarVisible: s.sidebarVisible, bottomVisible: s.bottomVisible, bottomTab: s.bottomTab, device: s.device,
  editorRatio: s.editorRatio, sidebarWidth: s.sidebarWidth, bottomHeight: s.bottomHeight,
});

const cloneNodes = (nodes: ProjectNode[]): ProjectNode[] => nodes.map((n) => ({ ...n }));

const newProject = (name: string, nodes: ProjectNode[], templateId?: string): Project => {
  const now = Date.now();
  return { id: uid(), name, nodes: withParentFolders(cloneNodes(nodes)), createdAt: now, updatedAt: now, templateId };
};

const firstHtml = (p: Project) =>
  p.nodes.find((n) => n.path === 'index.html')?.path ??
  p.nodes.find((n) => n.type === 'file' && /\.html?$/i.test(n.path))?.path ??
  'index.html';

export const useStore = create<State>((set, get) => {
  const prefs = loadPrefs();

  /** Replace the current project through `fn`, bump timestamps and schedule autosave. */
  const mutate = (fn: (p: Project) => Project, markDirtyPath?: string) => {
    const { currentId, projects, dirty } = get();
    const idx = projects.findIndex((p) => p.id === currentId);
    if (idx < 0) return;
    const next = fn(projects[idx]);
    if (next === projects[idx]) return;
    const copy = [...projects];
    copy[idx] = { ...next, updatedAt: Date.now() };
    set({ projects: copy, dirty: markDirtyPath ? { ...dirty, [markDirtyPath]: true } : dirty });
    schedule();
  };

  const schedule = () => {
    const { settings } = get();
    clearTimeout(saveTimer);
    if (settings.autoSave) {
      set({ saveStatus: 'saving' });
      saveTimer = setTimeout(() => void get().saveNow(), 700);
    } else {
      set({ saveStatus: 'unsaved' });
    }
  };

  const persistPrefs = () => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(prefsOf(get())));
    } catch {
      /* ignore quota errors */
    }
  };

  const switchTo = (p: Project) => {
    const entry = firstHtml(p);
    const hasEntry = p.nodes.some((n) => n.path === entry);
    set({
      currentId: p.id,
      openTabs: hasEntry ? [entry] : [],
      activePath: hasEntry ? entry : null,
      dirty: {},
      previewPath: entry,
      previewNonce: get().previewNonce + 1,
      logs: [],
      problems: [],
      expanded: {},
      saveStatus: 'saved',
    });
    persistPrefs();
  };

  return {
    ...prefs,
    ready: false,
    projects: [],
    openTabs: [],
    activePath: null,
    dirty: {},
    saveStatus: 'saved',
    previewPath: 'index.html',
    previewNonce: 0,
    logs: [],
    problems: [],
    output: [],
    dialog: null,
    expanded: {},
    searchFocusTick: 0,
    revealTarget: null,

    // ------------------------------------------------------------------ init
    // Idempotent: React StrictMode runs effects twice in dev, which must not create two starter projects.
    init: async () => {
      if (initStarted) return;
      initStarted = true;
      let projects: Project[] = [];
      try {
        projects = await db.all();
      } catch (e) {
        console.error('IndexedDB unavailable', e);
      }
      if (!projects.length && !legacyAlreadyMigrated()) {
        const legacy = readLegacyProjects();
        if (legacy.length) {
          projects = legacy;
          await Promise.all(legacy.map((p) => db.put(p).catch(() => undefined)));
          markLegacyMigrated();
        }
      }
      if (!projects.length) {
        const starter = newProject('My first website', getTemplate('blank').nodes, 'blank');
        projects = [starter];
        await db.put(starter).catch(() => undefined);
      }
      projects.sort((a, b) => b.updatedAt - a.updatedAt);
      const current = projects.find((p) => p.id === get().currentId) ?? projects[0];
      set({ projects, ready: true });
      switchTo(current);
      get().addOutput('info', `Loaded ${projects.length} project${projects.length === 1 ? '' : 's'} from IndexedDB.`);
    },

    // -------------------------------------------------------------- projects
    createProject: async (name, templateId = 'blank') => {
      await get().saveNow();
      const t = getTemplate(templateId);
      const p = newProject(name.trim() || t.name, t.nodes, t.id);
      set({ projects: [p, ...get().projects] });
      await db.put(p).catch(() => undefined);
      switchTo(p);
      get().addOutput('success', `Created project “${p.name}” from template “${t.name}”.`);
    },

    openProject: async (id) => {
      if (id === get().currentId) return;
      const p = get().projects.find((x) => x.id === id);
      if (!p) return;
      await get().saveNow();
      switchTo(p);
    },

    renameProject: (id, name) => {
      const n = name.trim();
      if (!n) return;
      const projects = get().projects.map((p) => (p.id === id ? { ...p, name: n, updatedAt: Date.now() } : p));
      set({ projects });
      const p = projects.find((x) => x.id === id);
      if (p) void db.put(p).catch(() => undefined);
    },

    duplicateProject: async (id) => {
      const src = get().projects.find((p) => p.id === id);
      if (!src) return;
      await get().saveNow();
      const copy = newProject(`${src.name} copy`, src.nodes, src.templateId);
      set({ projects: [copy, ...get().projects] });
      await db.put(copy).catch(() => undefined);
      switchTo(copy);
      get().addOutput('success', `Duplicated “${src.name}”.`);
    },

    deleteProject: async (id) => {
      const target = get().projects.find((p) => p.id === id);
      if (!target) return;
      await db.remove(id).catch(() => undefined);
      let projects = get().projects.filter((p) => p.id !== id);
      if (!projects.length) {
        const starter = newProject('My first website', getTemplate('blank').nodes, 'blank');
        projects = [starter];
        await db.put(starter).catch(() => undefined);
      }
      set({ projects });
      if (get().currentId === id) switchTo(projects[0]);
      get().addOutput('info', `Deleted project “${target.name}”.`);
    },

    importZip: async (file) => {
      try {
        const { name, nodes } = await readZip(file);
        if (!nodes.length) throw new Error('The ZIP file is empty.');
        await get().saveNow();
        const p = newProject(name, nodes);
        set({ projects: [p, ...get().projects] });
        await db.put(p).catch(() => undefined);
        switchTo(p);
        get().addOutput('success', `Imported “${file.name}” (${nodes.filter((n) => n.type === 'file').length} files).`);
      } catch (e) {
        get().addOutput('error', `ZIP import failed: ${(e as Error).message}`);
      }
    },

    clearAllData: async () => {
      await db.clear().catch(() => undefined);
      try {
        localStorage.removeItem(UI_KEY);
        localStorage.setItem('webstudio.legacy.migrated', '1');
      } catch {
        /* ignore */
      }
      const starter = newProject('My first website', getTemplate('blank').nodes, 'blank');
      await db.put(starter).catch(() => undefined);
      set({ projects: [starter] });
      switchTo(starter);
    },

    saveNow: async () => {
      clearTimeout(saveTimer);
      const { projects, currentId } = get();
      const p = projects.find((x) => x.id === currentId);
      if (!p) return;
      try {
        await db.put(p);
        set({ saveStatus: 'saved', dirty: {} });
        channel?.postMessage({ type: 'saved', projectId: p.id });
      } catch (e) {
        set({ saveStatus: 'error' });
        get().addOutput('error', `Could not save project: ${(e as Error).message}`);
      }
    },

    // ----------------------------------------------------------------- files
    createFile: (path, content = '') => {
      const p = get().projects.find((x) => x.id === get().currentId);
      if (!p) return null;
      const err = validateName(basename(path));
      if (err) {
        get().addOutput('error', err);
        return null;
      }
      const finalPath = uniquePath(p.nodes, path);
      mutate((proj) => ({ ...proj, nodes: withParentFolders([...proj.nodes, { path: finalPath, type: 'file', content }]) }));
      const dir = dirname(finalPath);
      if (dir) get().toggleFolder(dir, true);
      get().openFile(finalPath);
      return finalPath;
    },

    createFolder: (path) => {
      const p = get().projects.find((x) => x.id === get().currentId);
      if (!p) return null;
      const err = validateName(basename(path));
      if (err) {
        get().addOutput('error', err);
        return null;
      }
      const finalPath = uniquePath(p.nodes, path);
      mutate((proj) => ({ ...proj, nodes: withParentFolders([...proj.nodes, { path: finalPath, type: 'folder', content: '' }]) }));
      get().toggleFolder(finalPath, true);
      return finalPath;
    },

    renameNode: (path, newName) => {
      const p = get().projects.find((x) => x.id === get().currentId);
      if (!p) return null;
      const err = validateName(newName);
      if (err) {
        get().addOutput('error', err);
        return null;
      }
      const newPath = joinPath(dirname(path), newName.trim());
      if (newPath === path) return path;
      if (p.nodes.some((n) => n.path.toLowerCase() === newPath.toLowerCase() && n.path !== path)) {
        get().addOutput('error', `“${newName}” already exists in this folder.`);
        return null;
      }
      const remap = (x: string) => (x === path ? newPath : x.startsWith(path + '/') ? newPath + x.slice(path.length) : x);
      mutate((proj) => ({ ...proj, nodes: proj.nodes.map((n) => ({ ...n, path: remap(n.path) })) }));
      const s = get();
      const expanded: Record<string, boolean> = {};
      Object.entries(s.expanded).forEach(([k, v]) => (expanded[remap(k)] = v));
      set({
        openTabs: s.openTabs.map(remap),
        activePath: s.activePath ? remap(s.activePath) : null,
        previewPath: remap(s.previewPath),
        dirty: Object.fromEntries(Object.entries(s.dirty).map(([k, v]) => [remap(k), v])),
        expanded,
      });
      return newPath;
    },

    deleteNode: (path) => {
      const inside = (x: string) => x === path || x.startsWith(path + '/');
      mutate((proj) => ({ ...proj, nodes: proj.nodes.filter((n) => !inside(n.path)) }));
      const s = get();
      const openTabs = s.openTabs.filter((t) => !inside(t));
      let activePath = s.activePath;
      if (activePath && inside(activePath)) activePath = openTabs[openTabs.length - 1] ?? null;
      const proj = s.projects.find((x) => x.id === s.currentId);
      set({ openTabs, activePath, previewPath: inside(s.previewPath) && proj ? firstHtml(proj) : s.previewPath });
      get().refreshPreview();
    },

    moveNode: (path, targetFolder) => {
      const p = get().projects.find((x) => x.id === get().currentId);
      if (!p) return;
      if (dirname(path) === targetFolder) return;
      if (targetFolder === path || targetFolder.startsWith(path + '/')) {
        get().addOutput('error', 'Cannot move a folder into itself.');
        return;
      }
      const newPath = joinPath(targetFolder, basename(path));
      if (p.nodes.some((n) => n.path.toLowerCase() === newPath.toLowerCase())) {
        get().addOutput('error', `“${basename(path)}” already exists in the target folder.`);
        return;
      }
      const remap = (x: string) => (x === path ? newPath : x.startsWith(path + '/') ? newPath + x.slice(path.length) : x);
      mutate((proj) => ({ ...proj, nodes: withParentFolders(proj.nodes.map((n) => ({ ...n, path: remap(n.path) }))) }));
      const s = get();
      set({
        openTabs: s.openTabs.map(remap),
        activePath: s.activePath ? remap(s.activePath) : null,
        previewPath: remap(s.previewPath),
      });
      if (targetFolder) get().toggleFolder(targetFolder, true);
    },

    updateContent: (path, content) => {
      mutate(
        (proj) => {
          const i = proj.nodes.findIndex((n) => n.path === path);
          if (i < 0 || proj.nodes[i].content === content) return proj;
          const nodes = [...proj.nodes];
          nodes[i] = { ...nodes[i], content };
          return { ...proj, nodes };
        },
        path,
      );
    },

    importFiles: async (files, folder = '') => {
      const p = get().projects.find((x) => x.id === get().currentId);
      if (!p || !files.length) return;
      const added: ProjectNode[] = [];
      const taken = [...p.nodes];
      for (const f of files) {
        try {
          const desired = joinPath(folder, f.name);
          const finalPath = uniquePath(taken, desired);
          const node = await readFileAsNode(f, finalPath);
          taken.push(node);
          added.push(node);
        } catch (e) {
          get().addOutput('error', `Could not read ${f.name}: ${(e as Error).message}`);
        }
      }
      if (!added.length) return;
      mutate((proj) => ({ ...proj, nodes: withParentFolders([...proj.nodes, ...added]) }));
      get().addOutput('success', `Imported ${added.length} file${added.length === 1 ? '' : 's'}.`);
      const firstText = added.find((n) => !n.binary);
      if (firstText) get().openFile(firstText.path);
    },

    replaceInFiles: (replacements) => {
      if (!replacements.length) return;
      const map = new Map(replacements.map((r) => [r.path, r.content]));
      mutate((proj) => ({
        ...proj,
        nodes: proj.nodes.map((n) => (map.has(n.path) ? { ...n, content: map.get(n.path)! } : n)),
      }));
      const dirty = { ...get().dirty };
      replacements.forEach((r) => (dirty[r.path] = true));
      set({ dirty });
    },

    // ------------------------------------------------------------------ tabs
    openFile: (path, line, column) => {
      const s = get();
      const proj = s.projects.find((x) => x.id === s.currentId);
      const node = proj?.nodes.find((n) => n.path === path);
      if (!node || node.type !== 'file') return;
      set({
        openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
        activePath: path,
        revealTarget: line ? { path, line, column: column ?? 1, tick: Date.now() } : s.revealTarget,
        layout: s.layout === 'preview' ? 'split' : s.layout,
      });
      // expand ancestors
      const expanded = { ...get().expanded };
      let dir = dirname(path);
      while (dir) {
        expanded[dir] = true;
        dir = dirname(dir);
      }
      set({ expanded });
    },

    closeTab: (path) => {
      const s = get();
      const idx = s.openTabs.indexOf(path);
      if (idx < 0) return;
      const openTabs = s.openTabs.filter((t) => t !== path);
      let activePath = s.activePath;
      if (activePath === path) activePath = openTabs[Math.min(idx, openTabs.length - 1)] ?? null;
      set({ openTabs, activePath });
    },

    closeOtherTabs: (path) => set({ openTabs: [path], activePath: path }),
    setActive: (path) => set({ activePath: path }),

    toggleFolder: (path, force) => {
      const cur = get().expanded[path] ?? false;
      set({ expanded: { ...get().expanded, [path]: force ?? !cur } });
    },
    collapseAll: () => set({ expanded: {} }),

    // -------------------------------------------------------------------- ui
    setLayout: (layout) => { set({ layout }); persistPrefs(); },
    setSidebarView: (sidebarView) => { set({ sidebarView, sidebarVisible: true }); persistPrefs(); },
    toggleSidebar: (force) => { set({ sidebarVisible: force ?? !get().sidebarVisible }); persistPrefs(); },
    toggleBottom: (force) => { set({ bottomVisible: force ?? !get().bottomVisible }); persistPrefs(); },
    setBottomTab: (bottomTab) => { set({ bottomTab, bottomVisible: true }); persistPrefs(); },
    setDevice: (device) => { set({ device }); persistPrefs(); },
    setEditorRatio: (editorRatio) => { set({ editorRatio: Math.min(0.8, Math.max(0.2, editorRatio)) }); persistPrefs(); },
    setSidebarWidth: (sidebarWidth) => { set({ sidebarWidth: Math.min(520, Math.max(180, sidebarWidth)) }); persistPrefs(); },
    setBottomHeight: (bottomHeight) => { set({ bottomHeight: Math.min(600, Math.max(90, bottomHeight)) }); persistPrefs(); },
    updateSettings: (patch) => { set({ settings: { ...get().settings, ...patch } }); persistPrefs(); },
    focusSearch: () => set({ sidebarView: 'search', sidebarVisible: true, searchFocusTick: get().searchFocusTick + 1 }),
    openDialog: (dialog) => set({ dialog }),
    closeDialog: () => set({ dialog: null }),

    // ------------------------------------------------------ preview & console
    refreshPreview: () => set({ previewNonce: get().previewNonce + 1 }),

    navigatePreview: (href) => {
      const s = get();
      const proj = s.projects.find((x) => x.id === s.currentId);
      if (!proj) return;
      const target = resolvePath(dirname(s.previewPath), href);
      if (proj.nodes.some((n) => n.path === target && n.type === 'file')) {
        set({ previewPath: target });
      } else {
        get().addLog('warn', `Preview navigation: “${href}” does not exist in this project.`);
      }
    },

    addLog: (level, text, loc) => {
      const entry: ConsoleEntry = { id: logId++, level, text, time: Date.now(), ...loc };
      const logs = get().logs;
      set({ logs: logs.length > 1000 ? [...logs.slice(-900), entry] : [...logs, entry] });
    },
    clearLogs: () => set({ logs: [] }),
    setProblems: (problems) => set({ problems }),
    addOutput: (kind, text) => {
      const out = get().output;
      set({ output: [...out.slice(-300), { id: outId++, time: Date.now(), kind, text }] });
    },
    clearOutput: () => set({ output: [] }),
  };
});

export const selectProject = (s: { projects: Project[]; currentId?: string | null }) =>
  s.projects.find((p) => p.id === s.currentId) ?? null;

export const useCurrentProject = () => useStore(selectProject);
