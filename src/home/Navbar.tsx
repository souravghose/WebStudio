import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { EDITOR_HREF } from './launch';
import { scrollToId } from './scroll';
import type { Theme } from './theme';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  scrolled: boolean;
  /** which scroll-linked section is currently in view */
  active: 'xd-top' | 'templates' | 'features';
}

const SCROLL_LINKS = [
  { label: 'Home', id: 'xd-top' as const },
  { label: 'Templates', id: 'templates' as const },
  { label: 'Explore', id: 'features' as const },
];

export function Navbar({ theme, onToggleTheme, scrolled, active }: Props) {
  const [open, setOpen] = useState(false);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  const scrollLink = (l: (typeof SCROLL_LINKS)[number], mobile = false) => (
    <button key={l.id} type="button" className={`xd-navlink ${!mobile && active === l.id ? 'is-active' : ''}`} onClick={() => go(l.id)}>
      {l.label}
    </button>
  );

  return (
    <header className={`xd-nav ${scrolled || open ? 'is-scrolled' : ''}`}>
      <nav className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8" aria-label="Main">
        <a href="#/" onClick={(e) => { e.preventDefault(); go('xd-top'); }} aria-label="XDevCodeStudio home">
          <Logo />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {scrollLink(SCROLL_LINKS[0])}
          <a href={EDITOR_HREF} className="xd-navlink">Playground</a>
          {scrollLink(SCROLL_LINKS[1])}
          {scrollLink(SCROLL_LINKS[2])}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {/* visibility utilities live on wrappers: .xd-btn / .xd-icon-btn set their own `display` */}
          <span className="hidden sm:block">
            <a href={EDITOR_HREF} className="xd-btn xd-btn-primary xd-btn-sm">
              Get Started <ArrowRight size={16} className="xd-arrow" />
            </a>
          </span>
          <span className="md:hidden">
            <button type="button" className="xd-icon-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="xd-mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </span>
        </div>
      </nav>

      {open && (
        <div id="xd-mobile-menu" className="xd-mobile-menu md:hidden">
          <div className="mx-auto flex max-w-[1180px] flex-col px-5 py-3 sm:px-8">
            {scrollLink(SCROLL_LINKS[0], true)}
            <a href={EDITOR_HREF} className="xd-navlink" onClick={() => setOpen(false)}>Playground <ArrowRight size={16} /></a>
            {scrollLink(SCROLL_LINKS[1], true)}
            {scrollLink(SCROLL_LINKS[2], true)}
            <a href={EDITOR_HREF} className="xd-btn xd-btn-primary mt-3 mb-2">Get Started <ArrowRight size={16} /></a>
          </div>
        </div>
      )}
    </header>
  );
}
