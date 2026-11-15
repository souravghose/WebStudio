import type { Project } from '../types';
import { uid } from './paths';

/**
 * Migrates projects saved by the original single-file WebStudio
 * (localStorage key "webstudio.projects.v1", shape { id, name, files: { html, css, js } }).
 */
export function readLegacyProjects(): Project[] {
  try {
    const raw = localStorage.getItem('webstudio.projects.v1');
    if (!raw) return [];
    const list = JSON.parse(raw) as { id?: string; name?: string; files?: { html?: string; css?: string; js?: string }; updated?: number }[];
    if (!Array.isArray(list)) return [];
    return list.map((p) => {
      const now = p.updated ?? Date.now();
      return {
        id: p.id || uid(),
        name: p.name || 'Imported project',
        createdAt: now,
        updatedAt: now,
        nodes: [
          { path: 'index.html', type: 'file' as const, content: p.files?.html ?? '' },
          { path: 'style.css', type: 'file' as const, content: p.files?.css ?? '' },
          { path: 'script.js', type: 'file' as const, content: p.files?.js ?? '' },
          { path: 'assets', type: 'folder' as const, content: '' },
        ],
      };
    });
  } catch {
    return [];
  }
}

export function markLegacyMigrated() {
  try {
    localStorage.setItem('webstudio.legacy.migrated', '1');
  } catch {
    /* ignore */
  }
}

export const legacyAlreadyMigrated = () => {
  try {
    return localStorage.getItem('webstudio.legacy.migrated') === '1';
  } catch {
    return true;
  }
};
