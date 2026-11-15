import { useStore } from '../store/useStore';
import { STARTERS, type StartKey } from './starters';

/**
 * How the homepage hands work over to the existing editor, using only the editor's own
 * store actions (createProject / openProject / openFile / updateContent).
 * The intent travels in the URL hash, so links also work in a new tab:
 *   #/editor                      open the editor as-is (resumes the last project)
 *   #/editor?start=html|css|js|website
 *   #/editor?template=<templateId>
 */
export type Intent = { kind: 'start'; key: StartKey } | { kind: 'template'; id: string };

const START_KEYS = Object.keys(STARTERS) as StartKey[];

export const EDITOR_HREF = '#/editor';

const INTENT_KEY = 'xdev.intent.v1';

/** Navigate to the editor, storing the intent in sessionStorage so the URL stays clean. */
export function startHref(_key: StartKey): string {
  return EDITOR_HREF; // href used as fallback; intent set in storeIntent
}
export function templateHref(_id: string): string {
  return EDITOR_HREF; // same
}

/** Call before navigating to the editor to persist the intent. */
export function storeIntent(intent: Intent) {
  try { sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent)); } catch {}
}

/** Read and clear the stored intent. */
export function popIntent(): Intent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(INTENT_KEY);
    return JSON.parse(raw) as Intent;
  } catch { return null; }
}

/** Legacy: also parse from hash in case someone arrives via a direct URL. */
export function parseIntent(hash: string): Intent | null {
  const stored = popIntent();
  if (stored) return stored;
  const q = hash.split('?')[1];
  if (!q) return null;
  const params = new URLSearchParams(q);
  const start = params.get('start');
  if (start && (START_KEYS as string[]).includes(start)) return { kind: 'start', key: start as StartKey };
  const template = params.get('template');
  if (template) return { kind: 'template', id: template };
  return null;
}

/** No-op: URL is already clean (no query string in hash). */
export function clearIntentFromUrl() {
  // sessionStorage-based flow leaves no query in the hash — nothing to clear
}

let running = false;

export async function runIntent(intent: Intent): Promise<void> {
  if (running) return;
  running = true;
  try {
    const st = useStore.getState();

    if (intent.kind === 'template') {
      const { TEMPLATES } = await import('../lib/templates');
      const t = TEMPLATES.find((x) => x.id === intent.id);
      if (!t) {
        st.addOutput('error', `Template “${intent.id}” was not found.`);
        return;
      }
      await st.createProject(t.name, t.id);
      return;
    }

    const starter = STARTERS[intent.key];
    const existing = useStore.getState().projects.find((p) => p.name === starter.name);
    if (existing) {
      await useStore.getState().openProject(existing.id);
    } else {
      await useStore.getState().createProject(starter.name, 'blank');
      const s = useStore.getState();
      for (const [path, content] of Object.entries(starter.files ?? {})) s.updateContent(path, content);
    }
    useStore.getState().openFile(starter.open);
  } finally {
    clearIntentFromUrl();
    running = false;
  }
}
