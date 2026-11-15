import { ChevronDown, ChevronRight, File, FileCode2, FileJson, FileText, Folder, FolderOpen, Hash, Image as ImageIcon, Braces } from 'lucide-react';
import { extname } from '../../lib/paths';

export function FileIcon({ path, size = 15 }: { path: string; size?: number }) {
  const p = { size, strokeWidth: 1.8, className: 'shrink-0' };
  switch (extname(path)) {
    case 'html': case 'htm': return <FileCode2 {...p} style={{ color: '#fb923c' }} />;
    case 'css': return <Hash {...p} style={{ color: '#38bdf8' }} />;
    case 'js': case 'mjs': case 'jsx': return <Braces {...p} style={{ color: '#facc15' }} />;
    case 'ts': case 'tsx': return <Braces {...p} style={{ color: '#60a5fa' }} />;
    case 'json': return <FileJson {...p} style={{ color: '#a3e635' }} />;
    case 'md': case 'txt': return <FileText {...p} style={{ color: '#94a3b8' }} />;
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': case 'ico': case 'avif':
      return <ImageIcon {...p} style={{ color: '#c084fc' }} />;
    default: return <File {...p} style={{ color: '#94a3b8' }} />;
  }
}

export function FolderIcon({ open, size = 15 }: { open: boolean; size?: number }) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon size={size} strokeWidth={1.8} className="shrink-0" style={{ color: '#7c8ba7' }} />;
}

export function Chevron({ open }: { open: boolean }) {
  const Icon = open ? ChevronDown : ChevronRight;
  return <Icon size={14} className="shrink-0 text-ws-muted" />;
}
