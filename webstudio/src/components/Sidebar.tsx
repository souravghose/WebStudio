import { useStore } from '../store/useStore';
import { Explorer } from './sidebar/Explorer';
import { SearchPanel } from './sidebar/SearchPanel';
import { ProjectsPanel } from './sidebar/ProjectsPanel';
import { TemplatesPanel } from './sidebar/TemplatesPanel';
import { ExtensionsPanel } from './sidebar/ExtensionsPanel';
import { SettingsPanel } from './sidebar/SettingsPanel';

export function Sidebar() {
  const view = useStore((s) => s.sidebarView);
  return (
    <aside aria-label="Side bar" className="h-full min-h-0 min-w-0 overflow-hidden bg-ws-side">
      {view === 'explorer' && <Explorer />}
      {view === 'search' && <SearchPanel />}
      {view === 'projects' && <ProjectsPanel />}
      {view === 'templates' && <TemplatesPanel />}
      {view === 'extensions' && <ExtensionsPanel />}
      {view === 'settings' && <SettingsPanel />}
    </aside>
  );
}
