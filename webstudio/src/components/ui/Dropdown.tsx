import { useRef, useState, type ReactNode } from 'react';
import { ContextMenu, type MenuItem } from './ContextMenu';

interface Props {
  items: MenuItem[];
  title?: string;
  className?: string;
  children: ReactNode;
}

/** A button that opens a ContextMenu anchored beneath it. */
export function Dropdown({ items, title, className = 'btn', children }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        ref={ref}
        title={title}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        className={className}
        onClick={() => {
          const r = ref.current!.getBoundingClientRect();
          setPos(pos ? null : { x: r.left, y: r.bottom + 4 });
        }}
      >
        {children}
      </button>
      {pos && <ContextMenu x={pos.x} y={pos.y} items={items} onClose={() => setPos(null)} />}
    </>
  );
}
