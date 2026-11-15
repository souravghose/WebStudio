export type NodeType = 'file' | 'folder';

export interface ProjectNode {
  /** POSIX-style path relative to the project root, e.g. "assets/logo.png" */
  path: string;
  type: NodeType;
  /** Text content, or a data: URL when `binary` is true. Empty for folders. */
  content: string;
  binary?: boolean;
}

export interface Project {
  id: string;
  name: string;
  nodes: ProjectNode[];
  createdAt: number;
  updatedAt: number;
  templateId?: string;
}

export type Layout = 'split' | 'editor' | 'preview';
export type Device = 'desktop' | 'tablet' | 'mobile';
export type SidebarView = 'explorer' | 'search' | 'projects' | 'templates' | 'extensions' | 'settings';
export type BottomTab = 'console' | 'problems' | 'output' | 'terminal';
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'system' | 'result';

export interface ConsoleEntry {
  id: number;
  level: LogLevel;
  text: string;
  time: number;
  file?: string;
  line?: number;
  column?: number;
}

export interface Problem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  source?: string;
}

export interface OutputEntry {
  id: number;
  time: number;
  kind: 'info' | 'success' | 'error';
  text: string;
}

export interface Settings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
  autoRun: boolean;
  previewDelay: number;
  clearConsoleOnRun: boolean;
  autoCloseTags: boolean;
  linkedEditing: boolean;
  bracketColors: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  autoSave: true,
  formatOnSave: false,
  autoRun: true,
  previewDelay: 500,
  clearConsoleOnRun: true,
  autoCloseTags: true,
  linkedEditing: true,
  bracketColors: true,
};

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  accent: string;
  nodes: ProjectNode[];
}
