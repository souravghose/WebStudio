import { useRef } from 'react';
import { Copy, Download, FolderPlus, Pencil, Trash2, Upload } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { exportProject } from '../../lib/actions';
import { validateName } from '../../lib/paths';

const ago = (t: number) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(t).toLocaleDateString();
};

export function ProjectsPanel() {
  const projects = useStore((s) => s.projects);
  const currentId = useStore((s) => s.currentId);
  const st = useStore.getState();
  const zipInput = useRef<HTMLInputElement>(null);

  const newProject = () =>
    st.openDialog({
      kind: 'prompt', title: 'New blank project', label: 'Project name', initial: 'Untitled project', confirmLabel: 'Create',
      validate: validateName,
      onSubmit: (name) => void useStore.getState().createProject(name, 'blank'),
    });

  const rename = (id: string, current: string) =>
    st.openDialog({
      kind: 'prompt', title: 'Rename project', label: 'Project name', initial: current, confirmLabel: 'Rename',
      onSubmit: (name) => useStore.getState().renameProject(id, name),
    });

  const remove = (id: string, name: string) =>
    st.openDialog({
      kind: 'confirm', title: 'Delete project', danger: true, confirmLabel: 'Delete',
      message: `Permanently delete “${name}” from this browser? Export it first if you want a backup.`,
      onConfirm: () => void useStore.getState().deleteProject(id),
    });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">Projects</span>
        <div className="flex">
          <button className="icon-btn" title="New project" onClick={newProject}><FolderPlus size={14} /></button>
          <button className="icon-btn" title="Import ZIP project" onClick={() => zipInput.current?.click()}><Upload size={14} /></button>
        </div>
      </div>
      <input ref={zipInput} type="file" accept=".zip,application/zip" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void useStore.getState().importZip(f); e.target.value = ''; }} />
      <div className="min-h-0 flex-1 space-y-1 overflow-auto px-2 pb-2">
        {projects.map((p) => {
          const active = p.id === currentId;
          const files = p.nodes.filter((n) => n.type === 'file').length;
          return (
            <div key={p.id} className={`group rounded-lg border p-2.5 transition-colors ${active ? 'border-ws-accent/60 bg-ws-accent/10' : 'border-transparent hover:border-ws-border hover:bg-ws-hover'}`}>
              <button className="block w-full text-left" onClick={() => void st.openProject(p.id)}>
                <div className="truncate text-[13px] font-medium text-ws-text">{p.name}</div>
                <div className="text-[11px] text-ws-muted">{files} file{files === 1 ? '' : 's'} · edited {ago(p.updatedAt)}</div>
              </button>
              <div className="mt-1.5 flex gap-0.5 opacity-70 group-hover:opacity-100">
                <button className="icon-btn !h-6 !w-6" title="Rename" onClick={() => rename(p.id, p.name)}><Pencil size={12} /></button>
                <button className="icon-btn !h-6 !w-6" title="Duplicate" onClick={() => void st.duplicateProject(p.id)}><Copy size={12} /></button>
                {active && <button className="icon-btn !h-6 !w-6" title="Export ZIP" onClick={() => void exportProject()}><Download size={12} /></button>}
                <button className="icon-btn !h-6 !w-6 hover:!text-red-400" title="Delete" onClick={() => remove(p.id, p.name)}><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
