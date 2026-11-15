import { useEffect, useMemo, useRef, useState } from 'react';
import { buildPreview } from '../lib/preview';
import { getTemplate } from '../lib/templates';

const W = 1280; // the template is laid out at desktop width, then scaled down to fit the card

/**
 * A real, scaled-down render of the template's own HTML/CSS/JS (not a mock image).
 * It only mounts once it is near the viewport, runs in a script-only sandbox with no
 * access to this page, and ignores pointer input so the card stays clickable.
 */
export function TemplateThumb({ templateId, title }: { templateId: string; title: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [visible, setVisible] = useState(false);

  const doc = useMemo(() => (visible ? buildPreview(getTemplate(templateId).nodes, 'index.html', 'thumb').html : ''), [visible, templateId]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io?.disconnect();
          }
        },
        { rootMargin: '240px' },
      );
      io.observe(el);
    } else setVisible(true);

    return () => {
      ro.disconnect();
      io?.disconnect();
    };
  }, []);

  return (
    <div className="xd-thumb-frame">
      <div className="xd-thumb-chrome" aria-hidden="true"><i /><i /><i /></div>
      <div ref={wrap} className="xd-thumb">
        {visible && (
          <iframe
            title={`${title} preview`}
            srcDoc={doc}
            sandbox="allow-scripts"
            tabIndex={-1}
            aria-hidden="true"
            loading="lazy"
            style={{ transform: `scale(${scale})` }}
          />
        )}
      </div>
    </div>
  );
}
