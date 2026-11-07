import JSZip from 'jszip';
import type { Project, ProjectNode } from '../types';
import { isTextFile, mimeFor, slug, withParentFolders } from './paths';

export async function exportProjectZip(project: Project): Promise<void> {
  const zip = new JSZip();
  for (const n of project.nodes) {
    if (n.type === 'folder') {
      zip.folder(n.path);
    } else if (n.binary) {
      const base64 = n.content.slice(n.content.indexOf(',') + 1);
      zip.file(n.path, base64, { base64: true });
    } else {
      zip.file(n.path, n.content);
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  download(blob, `${slug(project.name)}.zip`);
}

export function download(blob: Blob, filename: string) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readZip(file: File): Promise<{ name: string; nodes: ProjectNode[] }> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((e) => !e.name.startsWith('__MACOSX/') && !e.name.endsWith('.DS_Store'));

  // strip a single wrapping folder (common when zipping a folder)
  const tops = new Set(entries.map((e) => e.name.split('/')[0]));
  const wrapper = tops.size === 1 && entries.some((e) => e.name.includes('/')) ? [...tops][0] + '/' : '';

  const nodes: ProjectNode[] = [];
  for (const entry of entries) {
    const path = (wrapper ? entry.name.slice(wrapper.length) : entry.name).replace(/\/$/, '');
    if (!path) continue;
    if (entry.dir) {
      nodes.push({ path, type: 'folder', content: '' });
    } else if (isTextFile(path)) {
      nodes.push({ path, type: 'file', content: await entry.async('string') });
    } else {
      const b64 = await entry.async('base64');
      nodes.push({ path, type: 'file', content: `data:${mimeFor(path)};base64,${b64}`, binary: true });
    }
  }
  return { name: file.name.replace(/\.zip$/i, '') || 'Imported project', nodes: withParentFolders(nodes) };
}

export function readFileAsNode(file: File, path: string): Promise<ProjectNode> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    if (isTextFile(file.name)) {
      reader.onload = () => resolve({ path, type: 'file', content: String(reader.result) });
      reader.readAsText(file);
    } else {
      reader.onload = () => resolve({ path, type: 'file', content: String(reader.result), binary: true });
      reader.readAsDataURL(file);
    }
  });
}
