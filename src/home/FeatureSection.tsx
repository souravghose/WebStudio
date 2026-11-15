import { FolderTree, MonitorSmartphone, SquareTerminal, Zap, type LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';

// Every item below describes something the editor already does.
const FEATURES: { icon: LucideIcon; title: string; text: string; chips: string[] }[] = [
  {
    icon: Zap,
    title: 'Instant Live Preview',
    text: 'See every change as you type. The sandboxed preview refreshes automatically, and console output and runtime errors appear right below.',
    chips: ['Auto-refresh', 'Sandboxed', 'Console & errors'],
  },
  {
    icon: SquareTerminal,
    title: 'Powerful Code Editor',
    text: 'Built on Monaco, the engine behind VS Code: IntelliSense, bracket matching, find & replace, a minimap and one-key Prettier formatting.',
    chips: ['IntelliSense', 'Prettier', 'Multi-tab'],
  },
  {
    icon: FolderTree,
    title: 'Organized Project Workspace',
    text: 'A file explorer with folders and drag-and-drop, search across files, autosave, and ZIP import/export. Your projects stay in your browser.',
    chips: ['Autosave', 'ZIP import/export', 'Search files'],
  },
  {
    icon: MonitorSmartphone,
    title: 'Responsive Device Preview',
    text: 'Check your layout on desktop, tablet and mobile viewports, go fullscreen, or open the preview in its own tab.',
    chips: ['Desktop', 'Tablet', 'Mobile'],
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="xd-section">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="xd-eyebrow">Features</span>
          <h2 className="xd-h2">Everything you need to build.</h2>
          <p className="xd-lead">A focused toolset for writing, previewing and organizing your web projects.</p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text, chips }, i) => (
            <Reveal key={title} delay={(i % 2) * 90}>
              <article className="xd-card xd-lift">
                <span className="xd-feature-icon"><Icon size={22} strokeWidth={1.9} /></span>
                <h3 className="mt-5 text-xl font-bold tracking-tight">{title}</h3>
                <p className="xd-muted mt-2 text-[15px] leading-relaxed">{text}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {chips.map((c) => <span key={c} className="xd-chip">{c}</span>)}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
