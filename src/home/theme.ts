import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'xdev.theme.v1';

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

/** The theme to paint before React renders (used by loading placeholders). */
export const initialTheme = (): Theme => stored() ?? systemTheme();

/**
 * Homepage theme: the saved choice wins; on a first visit we follow the system preference
 * (and keep following it until the visitor makes an explicit choice).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (!stored()) setTheme(mq.matches ? 'light' : 'dark');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage unavailable — the choice just lasts for this visit */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
