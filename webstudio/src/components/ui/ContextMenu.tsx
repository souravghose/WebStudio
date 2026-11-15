import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuItem {
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.max(4, Math.min(x, window.innerWidth - r.width - 4)), y: Math.max(4, Math.min(y, window.innerHeight - r.height - 4)) });
  }, [x, y]);

  useEffect(() => {
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    window.addEventListener('blur', onClose);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
      window.removeEventListener('blur', onClose);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 min-w-[200px] rounded-lg border border-ws-border bg-ws-panel p-1 text-xs shadow-2xl shadow-black/50"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 h-px bg-ws-border" />
        ) : (
          <button
            key={i}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onClick?.();
            }}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors disabled:opacity-40 ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-ws-text hover:bg-ws-accent/15'}`}
          >
            <span className="flex h-4 w-4 items-center justify-center text-ws-muted">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-ws-muted">{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
