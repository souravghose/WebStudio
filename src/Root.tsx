import { lazy, Suspense, useEffect, useState } from 'react';
import { initialTheme } from './home/theme';

// Each route is its own chunk, so the homepage never downloads Monaco (~3 MB).
const HomePage = lazy(() => import('./home/HomePage'));
const EditorRoute = lazy(() => import('./EditorRoute'));
const AboutPage = lazy(() => import('./home/AboutPage'));

type Route = 'home' | 'editor' | 'about';

/**
 * Hash routing (#/, #/about and #/editor): works on any static host (Vercel, Netlify, GitHub Pages,
 * a plain folder) with no rewrite rules and no extra dependency.
 */
const getRoute = (): Route => {
  const hash = window.location.hash;
  if (hash.startsWith('#/editor')) return 'editor';
  if (hash.startsWith('#/about')) return 'about';
  return 'home';
};

function Splash({ route }: { route: Route }) {
  const dark = route === 'editor' || initialTheme() === 'dark';
  return <div className="h-full w-full" style={{ background: dark ? (route === 'editor' ? '#0D1117' : '#080D18') : '#FAFBFF' }} />;
}

export function Root() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    // hashchange fires when the fragment changes; popstate also fires on back/forward
    // navigation (including when going from #/editor back to no-hash).
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return <Suspense fallback={<Splash route={route} />}>{route === 'editor' ? <EditorRoute /> : route === 'about' ? <AboutPage /> : <HomePage />}</Suspense>;
}
