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

// ---- cross-page navigation (About -> a homepage section) ----
const PENDING_KEY = 'xd.scrollTo';

/** Remember which homepage section to scroll to after navigating to `#/`. */
export function setPendingScroll(id: string) {
  try {
    if (id === 'xd-top') sessionStorage.removeItem(PENDING_KEY);
    else sessionStorage.setItem(PENDING_KEY, id);
  } catch {
    /* storage unavailable: simply land at the top */
  }
}

export function takePendingScroll(): string | null {
  try {
    const id = sessionStorage.getItem(PENDING_KEY);
    if (id) sessionStorage.removeItem(PENDING_KEY);
    return id;
  } catch {
    return null;
  }
}
