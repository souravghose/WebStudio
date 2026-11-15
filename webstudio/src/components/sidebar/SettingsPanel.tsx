import { useStore } from '../../store/useStore';
import type { Settings } from '../../types';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

function Toggle({ k, label, hint }: { k: BoolKey; label: string; hint?: string }) {
  const value = useStore((s) => s.settings[k]);
  const update = useStore((s) => s.updateSettings);
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-1.5">
      <span>
        <span className="block text-xs text-ws-text">{label}</span>
        {hint && <span className="block text-[11px] text-ws-muted">{hint}</span>}
      </span>
      <input type="checkbox" checked={value} onChange={(e) => update({ [k]: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500" />
    </label>
  );
}

function Num({ k, label, min, max, step = 1, unit }: { k: 'fontSize' | 'tabSize' | 'previewDelay'; label: string; min: number; max: number; step?: number; unit?: string }) {
  const value = useStore((s) => s.settings[k]);
  const update = useStore((s) => s.updateSettings);
  return (
    <div className="py-1.5">
      <div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="tabular-nums text-ws-muted">{value}{unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => update({ [k]: Number(e.target.value) })} className="w-full accent-indigo-500" />
    </div>
  );
}

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-4">
    <h4 className="mb-1 border-b border-ws-border pb-1 text-[11px] font-semibold uppercase tracking-wider text-ws-muted">{title}</h4>
    {children}
  </section>
);

export function SettingsPanel() {
  const st = useStore.getState();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">Settings</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-4">
        <Group title="Editor">
          <Num k="fontSize" label="Font size" min={10} max={28} unit="px" />
          <Num k="tabSize" label="Tab size" min={2} max={8} step={2} />
          <Toggle k="wordWrap" label="Word wrap" />
          <Toggle k="minimap" label="Minimap" />
          <Toggle k="lineNumbers" label="Line numbers" />
          <Toggle k="autoCloseTags" label="Auto-close HTML tags" />
          <Toggle k="linkedEditing" label="Linked tag editing" hint="Renaming an opening tag renames its closing tag." />
          <Toggle k="bracketColors" label="Bracket pair colours" />
        </Group>
        <Group title="Saving & formatting">
          <Toggle k="autoSave" label="Autosave" hint="Save to this browser shortly after you stop typing." />
          <Toggle k="formatOnSave" label="Format on save" hint="Run Prettier when you press Ctrl+S." />
        </Group>
        <Group title="Live preview">
          <Toggle k="autoRun" label="Update preview automatically" />
          <Num k="previewDelay" label="Update delay" min={100} max={3000} step={100} unit="ms" />
          <Toggle k="clearConsoleOnRun" label="Clear console on each run" />
        </Group>
        <Group title="Help">
          <div className="flex gap-2 py-1">
            <button className="btn" onClick={() => st.openDialog({ kind: 'shortcuts' })}>Keyboard shortcuts</button>
            <button className="btn" onClick={() => st.openDialog({ kind: 'about' })}>About</button>
          </div>
        </Group>
        <Group title="Data">
          <p className="mb-2 text-[11px] leading-snug text-ws-muted">Projects live only in this browser (IndexedDB). Export a ZIP to back them up.</p>
          <button
            className="btn !border-red-500/50 text-red-400 hover:!border-red-500 hover:!text-red-300"
            onClick={() =>
              st.openDialog({
                kind: 'confirm', title: 'Clear all local data', danger: true, confirmLabel: 'Delete everything',
                message: 'This deletes every project stored in this browser and resets your settings. It cannot be undone.',
                onConfirm: () => void useStore.getState().clearAllData(),
              })
            }
          >
            Clear all projects & data
          </button>
        </Group>
      </div>
    </div>
  );
}
