import { useEffect, useRef, type ReactNode } from 'react';

/** Tiny helper so the snippets below stay readable: <T c="tag">…</T> renders a coloured token. */
const T = ({ c, children }: { c: string; children: ReactNode }) => <span className={c}>{children}</span>;

function Window({ className, title, children }: { className: string; title: string; children: ReactNode }) {
  return (
    <div className={`xd-win ${className}`}>
      <div className="bar"><i /><i /><i /><b>{title}</b></div>
      {children}
    </div>
  );
}

/**
 * Layered, floating "workspace" built from CSS 3D transforms only (HTML + CSS + JS cards and a
 * live preview window). The gentle pointer tilt is skipped for touch input and reduced motion.
 */
export function CodeWorkspaceIllustration() {
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    const sc = scene.current;
    if (!el || !sc) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      sc.style.setProperty('--ry', `${-17 + x * 10}deg`);
      sc.style.setProperty('--rx', `${9 - y * 8}deg`);
    };
    const leave = () => {
      sc.style.removeProperty('--ry');
      sc.style.removeProperty('--rx');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div ref={stage} className="xd-stage" role="img" aria-label="Illustration of a coding workspace: HTML, CSS and JavaScript code cards floating around a live website preview">
      <div ref={scene} className="xd-scene" aria-hidden="true">
        <div className="xd-orb o1" />
        <div className="xd-orb o2" />

        <Window className="xd-w-preview" title="localhost · preview">
          <span className="xd-live"><i /> Live</span>
          <div className="xd-site">
            <div className="nav"><span /><div><span /><span /><span /></div></div>
            <h4>Hello!</h4>
            <p>Edit the code and watch this page change instantly.</p>
            <span className="cta">Run</span>
          </div>
        </Window>

        <Window className="xd-w-html" title="index.html">
          <pre className="xd-code">
            <T c="tag">{'<main'}</T> <T c="attr">class</T>=<T c="str">"hero"</T><T c="tag">{'>'}</T>{'\n'}
            {'  '}<T c="tag">{'<h1>'}</T>Hello!<T c="tag">{'</h1>'}</T>{'\n'}
            {'  '}<T c="tag">{'<button>'}</T>Run<T c="tag">{'</button>'}</T>{'\n'}
            <T c="tag">{'</main>'}</T>
          </pre>
        </Window>

        <Window className="xd-w-css" title="style.css">
          <pre className="xd-code">
            <T c="sel">.hero</T> {'{'}{'\n'}
            {'  '}<T c="prop">display</T>: <T c="num">grid</T>;{'\n'}
            {'  '}<T c="prop">place-items</T>: <T c="num">center</T>;{'\n'}
            {'  '}<T c="prop">color</T>: <T c="str">#fff</T>;{'\n'}
            {'}'}
          </pre>
        </Window>

        <Window className="xd-w-js" title="script.js">
          <pre className="xd-code">
            <T c="com">{'// say hi'}</T>{'\n'}
            button.<T c="fn">onclick</T> = () <T c="kw">{'=>'}</T> {'{'}{'\n'}
            {'  '}console.<T c="fn">log</T>(<T c="str">"Hi!"</T>);{'\n'}
            {'}'};
          </pre>
        </Window>
      </div>
    </div>
  );
}
