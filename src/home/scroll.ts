export const SCROLLER_ID = 'xd-scroller';

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth-scroll the homepage's own scroll container to a section (hash stays untouched: it is the router). */
export function scrollToId(id: string) {
  const scroller = document.getElementById(SCROLLER_ID);
  const target = document.getElementById(id);
  if (!scroller || !target) return;
  const top = id === 'xd-top' ? 0 : target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 64;
  scroller.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
