import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SHORTCUTS } from '../hooks/useShortcuts';

function Shell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full rounded-xl border border-ws-border bg-ws-panel p-5 shadow-2xl ${wide ? 'max-w-lg' : 'max-w-md'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PromptBody({ label, initial, confirmLabel, validate, onSubmit, onClose }: {
  label: string; initial?: string; confirmLabel?: string; validate?: (v: string) => string | null;
  onSubmit: (v: string) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(initial ?? '');
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const submit = () => {
    const v = value.trim();
    const err = !v ? 'Please enter a name.' : validate?.(v) ?? null;
    if (err) return setError(err);
    onClose();
    onSubmit(v);
  };
  return (
    <>
      <label className="mb-1 block text-xs text-ws-muted">{label}</label>
      <input
        ref={ref}
        className="input"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(null); }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{confirmLabel ?? 'OK'}</button>
      </div>
    </>
  );
}

export function DialogHost() {
  const dialog = useStore((s) => s.dialog);
  const close = useStore((s) => s.closeDialog);
  if (!dialog) return null;

  switch (dialog.kind) {
    case 'confirm':
      return (
        <Shell title={dialog.title} onClose={close}>
          <p className="text-sm text-ws-muted">{dialog.message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn" onClick={close}>Cancel</button>
            <button
              autoFocus
              className={`btn ${dialog.danger ? '!border-red-500 !bg-red-500 !text-white hover:!bg-red-600' : 'btn-primary'}`}
              onClick={() => { close(); dialog.onConfirm(); }}
            >
              {dialog.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </Shell>
      );
    case 'prompt':
      return (
        <Shell title={dialog.title} onClose={close}>
          <PromptBody {...dialog} onClose={close} />
        </Shell>
      );
    case 'shortcuts':
      return (
        <Shell title="Keyboard shortcuts" onClose={close} wide>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-xs">
              <tbody>
                {SHORTCUTS.map((s) => (
                  <tr key={s.keys} className="border-b border-ws-border/60 last:border-0">
                    <td className="py-2 pr-4"><kbd className="rounded border border-ws-border bg-ws-editor px-1.5 py-0.5 font-mono text-[11px]">{s.keys}</kbd></td>
                    <td className="py-2 text-ws-muted">{s.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-ws-muted">On macOS use ⌘ in place of Ctrl.</p>
        </Shell>
      );
    case 'about':
      return (
        <Shell title="About WebStudio" onClose={close}>
          <p className="text-sm text-ws-muted">
            WebStudio is a browser-based IDE for HTML, CSS and JavaScript, built with React, TypeScript, Vite, Tailwind CSS and Monaco Editor.
            Projects are stored locally in your browser (IndexedDB) — nothing is uploaded anywhere.
          </p>
          <div className="mt-4 flex justify-end"><button className="btn btn-primary" onClick={close}>Close</button></div>
        </Shell>
      );
  }
}
