import { Logo } from './Logo';
import { EDITOR_HREF } from './launch';
import { scrollToId } from './scroll';

// No GitHub link on purpose: add one here once the project has a public repository URL.
export function Footer() {
  return (
    <footer className="xd-footer xd-band">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <Logo size="sm" />
          <p className="xd-muted mt-3 text-sm leading-relaxed">A fast, friendly online studio for HTML, CSS and JavaScript. Your projects stay in your browser.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <a href="#/" className="xd-flink" onClick={(e) => { e.preventDefault(); scrollToId('xd-top'); }}>Home</a>
          <a href={EDITOR_HREF} className="xd-flink">Playground</a>
          <a href="#templates" className="xd-flink" onClick={(e) => { e.preventDefault(); scrollToId('templates'); }}>Templates</a>
        </nav>
      </div>
      <div className="mx-auto max-w-[1180px] border-t px-5 py-5 text-[13px] sm:px-8" style={{ borderColor: 'var(--xd-border)' }}>
        <span className="xd-muted">© {new Date().getFullYear()} XDevCodeStudio. All rights reserved.</span>
      </div>
    </footer>
  );
}
