import { ArrowRight } from 'lucide-react';
import { storeIntent, EDITOR_HREF, type Intent } from './launch';

interface Props {
  name: string;
  /** short badge text shown in the coloured tile */
  badge: string;
  gradient: string;
  description: string;
  intent: Intent;
}

export function LanguageCard({ name, badge, gradient, description, intent }: Props) {
  function go(e: React.MouseEvent) {
    // Store intent BEFORE the navigation so EditorRoute can read it immediately.
    // Let the <a href> drive the actual navigation so it stays user-initiated
    // (userInitiated=true in the Navigation API, making the history entry non-skippable).
    storeIntent(intent);
    // If the browser refuses the href (same hash already set), force it.
    if (window.location.hash === EDITOR_HREF) {
      e.preventDefault();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  }
  return (
    <a href={EDITOR_HREF} onClick={go} className="xd-card xd-lift group" aria-label={`Start coding in ${name}`}>
      <span className="xd-lang-tile" style={{ background: gradient }} aria-hidden="true">{badge}</span>
      <h3 className="mt-5 text-xl font-bold tracking-tight">{name}</h3>
      <p className="xd-muted mt-2 text-[15px] leading-relaxed">{description}</p>
      <span className="xd-lang-go">Start Coding <ArrowRight size={16} /></span>
    </a>
  );
}
