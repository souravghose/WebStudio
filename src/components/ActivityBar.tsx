import { Files, LayoutTemplate, Puzzle, Search, Settings, FolderKanban } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { SidebarView } from '../types';

const TOP: { id: SidebarView; label: string; icon: typeof Files }[] = [
  { id: 'explorer', label: 'Explorer', icon: Files },
  { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: Search },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'extensions', label: 'Extensions', icon: Puzzle },
];

export function ActivityBar() {
  const view = useStore((s) => s.sidebarView);
  const visible = useStore((s) => s.sidebarVisible);
  const { setSidebarView, toggleSidebar } = useStore.getState();

  const Btn = ({ id, label, icon: Icon }: { id: SidebarView; label: string; icon: typeof Files }) => {
    const active = visible && view === id;
    return (
      <button
        title={label}
        aria-label={label}
        aria-pressed={active}
        onClick={() => (active ? toggleSidebar(false) : setSidebarView(id))}
        className={`relative grid h-11 w-full place-items-center transition-colors ${active ? 'text-ws-strong' : 'text-ws-muted hover:text-ws-text'}`}
      >
        {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-ws-accent" />}
        <Icon size={20} strokeWidth={1.7} />
      </button>
    );
  };

  return (
    <nav aria-label="Activity bar" className="hidden w-12 shrink-0 flex-col justify-between border-r border-ws-border bg-ws-bg py-1 sm:flex">
      <div>{TOP.map((t) => <Btn key={t.id} {...t} />)}</div>
      <Btn id="settings" label="Settings" icon={Settings} />
    </nav>
  );
}
