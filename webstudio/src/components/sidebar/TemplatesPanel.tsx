import { useStore } from '../../store/useStore';
import { TEMPLATES } from '../../lib/templates';
import { validateName } from '../../lib/paths';

export function TemplatesPanel() {
  const st = useStore.getState();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">Starter templates</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-2 pb-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() =>
              st.openDialog({
                kind: 'prompt', title: `New project from “${t.name}”`, label: 'Project name', initial: t.name, confirmLabel: 'Create project',
                validate: validateName,
                onSubmit: (name) => void useStore.getState().createProject(name, t.id),
              })
            }
            className="group block w-full overflow-hidden rounded-lg border border-ws-border text-left transition-colors hover:border-ws-accent"
          >
            <div className="h-14" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent}55 70%, transparent)` }} />
            <div className="p-2.5">
              <div className="text-[13px] font-medium text-ws-text">{t.name}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-ws-muted">{t.description}</div>
              <div className="mt-1.5 text-[10px] text-ws-muted">{t.nodes.filter((n) => n.type === 'file').length} files · HTML, CSS, JS</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
