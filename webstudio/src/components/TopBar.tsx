import { useEffect, useState } from 'react';
import {
  AlertCircle, Check, ChevronDown, CircleUser, Columns2, Download, FileCode2, FolderPlus, Keyboard, Info, Loader2,
  EllipsisVertical, Menu, Play, Redo2, Save, Settings as SettingsIcon, Sparkles, SquareSplitHorizontal, Undo2, Eye,
} from 'lucide-react';
import { useCurrentProject, useStore } from '../store/useStore';
import { editorBridge } from '../lib/editorBridge';
import { exportProject, formatActive, runPreview, saveProject } from '../lib/actions';
import { validateName } from '../lib/paths';
import { Dropdown } from './ui/Dropdown';
import type { Layout } from '../types';

const LAYOUTS: { id: Layout; label: string; icon: typeof Columns2 }[] = [
  { id: 'split', label: 'Split view', icon: Columns2 },
  { id: 'editor', label: 'Editor only', icon: FileCode2 },
  { id: 'preview', label: 'Preview only', icon: Eye },
];

function SaveIndicator() {
  const status = useStore((s) => s.saveStatus);
  const autoSave = useStore((s) => s.settings.autoSave);
  const map = {
    saved: { icon: <Check size={12} />, text: 'Saved', cls: 'text-emerald-400' },
    saving: { icon: <Loader2 size={12} className="animate-spin" />, text: 'Saving…', cls: 'text-amber-300' },
    unsaved: { icon: <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />, text: autoSave ? 'Unsaved' : 'Unsaved (Ctrl+S)', cls: 'text-amber-300' },
    error: { icon: <AlertCircle size={12} />, text: 'Save failed', cls: 'text-red-400' },
  }[status];
  return (
    <span role="status" aria-live="polite" className={`hidden items-center gap-1.5 text-[11px] sm:flex ${map.cls}`}>
      {map.icon}
      {map.text}
    </span>
  );
}

function ProjectName() {
  const project = useCurrentProject();
  const rename = useStore((s) => s.renameProject);
  const [value, setValue] = useState(project?.name ?? '');
  useEffect(() => setValue(project?.name ?? ''), [project?.id, project?.name]);
  if (!project) return null;
  const commit = () => {
    const v = value.trim();
    if (!v || validateName(v)) setValue(project.name);
    else if (v !== project.name) rename(project.id, v);
  };
  return (
    <input
      aria-label="Project name"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setValue(project.name);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-20 rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] font-medium text-ws-text outline-none transition-colors hover:border-ws-border focus:border-ws-accent focus:bg-ws-editor sm:w-44"
    />
  );
}

export function TopBar() {
  const projects = useStore((s) => s.projects);
  const currentId = useStore((s) => s.currentId);
  const layout = useStore((s) => s.layout);
  const st = useStore.getState();

  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-ws-border bg-ws-side px-2 sm:gap-2 sm:px-3">
      <button className="icon-btn sm:hidden" aria-label="Toggle sidebar" onClick={() => st.toggleSidebar()}><Menu size={16} /></button>
      <div className="flex items-center gap-2 pr-1">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-ws-accent to-ws-accent2 text-sm font-extrabold text-white">W</div>
        <span className="hidden text-sm font-bold tracking-tight lg:inline">WebStudio</span>
      </div>

      <Dropdown
        title="Switch project"
        className="btn !px-2"
        items={[
          ...projects.map((p) => ({ label: p.name, icon: p.id === currentId ? <Check size={13} /> : undefined, onClick: () => void useStore.getState().openProject(p.id) })),
          { divider: true },
          { label: 'New project…', icon: <FolderPlus size={13} />, onClick: () => useStore.getState().setSidebarView('templates') },
        ]}
      >
        <ChevronDown size={13} />
        <span className="hidden md:inline">Projects</span>
      </Dropdown>
      <ProjectName />
      <SaveIndicator />

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        <button className="icon-btn" title="Undo (Ctrl+Z)" onClick={() => editorBridge.undo()}><Undo2 size={15} /></button>
        <button className="icon-btn" title="Redo (Ctrl+Y)" onClick={() => editorBridge.redo()}><Redo2 size={15} /></button>
        <button className="icon-btn hidden sm:inline-flex" title="Save (Ctrl+S)" onClick={() => void saveProject()}><Save size={15} /></button>
        <button className="icon-btn hidden sm:inline-flex" title="Format document with Prettier (Alt+Shift+F)" onClick={() => void formatActive()}><Sparkles size={15} /></button>

        <span className="mx-1 hidden h-5 w-px bg-ws-border sm:block" />
        <div className="hidden items-center rounded-md border border-ws-border p-0.5 sm:flex" role="group" aria-label="Layout">
          {LAYOUTS.map(({ id, label, icon: Icon }) => (
            <button key={id} title={label} aria-pressed={layout === id} onClick={() => st.setLayout(id)} className={`icon-btn !h-6 !w-6 ${layout === id ? 'active' : ''}`}><Icon size={14} /></button>
          ))}
        </div>
        <Dropdown title="Layout" className="icon-btn sm:!hidden" items={LAYOUTS.map(({ id, label, icon: Icon }) => ({ label, icon: <Icon size={13} />, onClick: () => st.setLayout(id) }))}>
          <SquareSplitHorizontal size={15} />
        </Dropdown>

        <button className="btn btn-primary ml-1" title="Run / refresh preview (Ctrl+Enter)" onClick={runPreview}>
          <Play size={13} fill="currentColor" />
          <span className="hidden sm:inline">Run</span>
        </button>
        <Dropdown
          title="More"
          className="icon-btn sm:!hidden"
          items={[
            { label: 'Save', icon: <Save size={13} />, onClick: () => void saveProject() },
            { label: 'Format document', icon: <Sparkles size={13} />, onClick: () => void formatActive() },
            { label: 'Export ZIP', icon: <Download size={13} />, onClick: () => void exportProject() },
            { divider: true },
            { label: 'Settings', icon: <SettingsIcon size={13} />, onClick: () => st.setSidebarView('settings') },
            { label: 'Keyboard shortcuts', icon: <Keyboard size={13} />, onClick: () => st.openDialog({ kind: 'shortcuts' }) },
            { label: 'About WebStudio', icon: <Info size={13} />, onClick: () => st.openDialog({ kind: 'about' }) },
          ]}
        >
          <EllipsisVertical size={16} />
        </Dropdown>

        <button className="icon-btn hidden sm:inline-flex" title="Export project as ZIP (Ctrl+Shift+S)" onClick={() => void exportProject()}><Download size={15} /></button>
        <button className="icon-btn hidden sm:inline-flex" title="Settings" onClick={() => st.setSidebarView('settings')}><SettingsIcon size={15} /></button>

        <Dropdown
          title="Profile"
          className="icon-btn hidden sm:inline-flex"
          items={[
            { label: 'Local profile · data stays in this browser', disabled: true, icon: <CircleUser size={13} /> },
            { divider: true },
            { label: 'Keyboard shortcuts', icon: <Keyboard size={13} />, onClick: () => st.openDialog({ kind: 'shortcuts' }) },
            { label: 'About WebStudio', icon: <Info size={13} />, onClick: () => st.openDialog({ kind: 'about' }) },
          ]}
        >
          <CircleUser size={17} />
        </Dropdown>
      </div>
    </header>
  );
}
