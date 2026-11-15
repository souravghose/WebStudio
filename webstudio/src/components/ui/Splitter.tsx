import { useState } from 'react';

interface Props {
  /** "vertical" = a vertical bar that resizes horizontally (columns); "horizontal" = a horizontal bar (rows). */
  orientation: 'vertical' | 'horizontal';
  /** Called with the pointer's absolute client position while dragging. */
  onDrag: (clientX: number, clientY: number) => void;
  onDoubleClick?: () => void;
  label?: string;
}

export function Splitter({ orientation, onDrag, onDoubleClick, label }: Props) {
  const [active, setActive] = useState(false);
  const vertical = orientation === 'vertical';
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label ?? 'Resize'}
      title={label ?? 'Drag to resize'}
      onDoubleClick={onDoubleClick}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setActive(true);
        e.preventDefault();
      }}
      onPointerMove={(e) => active && onDrag(e.clientX, e.clientY)}
      onPointerUp={() => setActive(false)}
      onPointerCancel={() => setActive(false)}
      className={`group relative z-10 shrink-0 touch-none ${vertical ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-ws-border/60 transition-colors hover:bg-ws-accent ${active ? '!bg-ws-accent' : ''}`}
    >
      <span className={`absolute ${vertical ? '-inset-x-1.5 inset-y-0' : '-inset-y-1.5 inset-x-0'}`} />
    </div>
  );
}
