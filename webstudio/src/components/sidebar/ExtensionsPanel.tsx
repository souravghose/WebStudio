import { Boxes, Braces, Package, Terminal } from 'lucide-react';

const PLANNED = [
  { icon: Braces, title: 'JSX / TSX support', text: 'Edit React components with type-aware IntelliSense and compile them for the preview.' },
  { icon: Boxes, title: 'React project templates', text: 'Starter apps with components, hooks and a bundled runtime.' },
  { icon: Package, title: 'npm dependencies', text: 'Add packages to a project and resolve them in the preview.' },
  { icon: Terminal, title: 'Real terminal', text: 'Needs a server-side execution backend; not simulated in the browser.' },
];

export function ExtensionsPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">Extensions</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        <p className="mb-3 text-xs leading-relaxed text-ws-muted">
          There is no extension marketplace yet. The editor and project model are structured so these features can be added later:
        </p>
        <div className="space-y-2">
          {PLANNED.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-2.5 rounded-lg border border-ws-border p-2.5">
              <Icon size={16} className="mt-0.5 shrink-0 text-ws-accent2" />
              <div>
                <div className="flex items-center gap-2 text-[13px] font-medium">{title}<span className="rounded-full bg-ws-border px-1.5 text-[9px] uppercase tracking-wide text-ws-muted">Planned</span></div>
                <div className="mt-0.5 text-[11px] leading-snug text-ws-muted">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
