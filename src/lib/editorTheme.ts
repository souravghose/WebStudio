import { useSyncExternalStore } from 'react';
import { initialTheme, type Theme } from '../home/theme';

/**
 * Editor light/dark theme. It shares the homepage's storage key, so one choice applies everywhere,
 * and (like the homepage) follows the system setting until the user picks explicitly.
 * The theme is applied as <html data-theme="…">, which switches the --ws-* colour variables in index.css.
 */
const KEY = 'xdev.theme.v1';
const listeners = new Set<() => void>();
let current: Theme = initialTheme();

const apply = () => {
  document.documentElement.dataset.theme = current;
};
apply();

export function setEditorTheme(next: Theme) {
  current = next;
  apply();
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage unavailable — the choice lasts for this visit only */
  }
  listeners.forEach((l) => l());
}

export const toggleEditorTheme = () => setEditorTheme(current === 'dark' ? 'light' : 'dark');

export function useEditorTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}
