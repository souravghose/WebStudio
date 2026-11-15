import { useStore, selectProject } from '../store/useStore';
import { editorBridge } from './editorBridge';
import { canFormat, formatSource } from './format';
import { languageFor } from './paths';
import { exportProjectZip } from './zip';

/** Format the active editor document with Prettier, keeping undo history and cursor position. */
export async function formatActive(): Promise<boolean> {
  const st = useStore.getState();
  const editor = editorBridge.get();
  const model = editor?.getModel();
  const path = st.activePath;
  if (!editor || !model || !path) {
    st.addOutput('info', 'Open a file to format it.');
    return false;
  }
  const lang = languageFor(path);
  if (!canFormat(lang)) {
    st.addOutput('info', `Formatting is not available for ${path}.`);
    return false;
  }
  try {
    const source = model.getValue();
    const formatted = await formatSource(source, lang, st.settings.tabSize);
    if (formatted === source) {
      st.addOutput('info', `${path} is already formatted.`);
      return true;
    }
    const pos = editor.getPosition();
    const scrollTop = editor.getScrollTop();
    editor.pushUndoStop();
    editor.executeEdits('prettier', [{ range: model.getFullModelRange(), text: formatted }]);
    editor.pushUndoStop();
    if (pos) {
      const line = Math.min(pos.lineNumber, model.getLineCount());
      editor.setPosition({ lineNumber: line, column: Math.min(pos.column, model.getLineMaxColumn(line)) });
    }
    editor.setScrollTop(scrollTop);
    st.addOutput('success', `Formatted ${path} with Prettier.`);
    return true;
  } catch (e) {
    const msg = (e as Error).message.split('\n')[0];
    st.addOutput('error', `Could not format ${path}: ${msg}`);
    st.setBottomTab('output');
    return false;
  }
}

export async function saveProject(): Promise<void> {
  const st = useStore.getState();
  if (st.settings.formatOnSave) await formatActive();
  await useStore.getState().saveNow();
  useStore.getState().addOutput('success', 'Project saved.');
}

export function runPreview(): void {
  const st = useStore.getState();
  st.refreshPreview();
  st.addOutput('info', 'Preview refreshed.');
}

export async function exportProject(): Promise<void> {
  const st = useStore.getState();
  const project = selectProject(st);
  if (!project) return;
  await st.saveNow();
  try {
    await exportProjectZip(project);
    st.addOutput('success', `Exported “${project.name}” as ZIP.`);
  } catch (e) {
    st.addOutput('error', `Export failed: ${(e as Error).message}`);
  }
}
