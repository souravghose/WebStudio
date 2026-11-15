import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronsDownUp, FilePlus, FolderPlus, Upload } from 'lucide-react';
import { useCurrentProject, useStore } from '../../store/useStore';
import { basename, buildTree, dirname, joinPath, validateName, type TreeItem } from '../../lib/paths';
import { Chevron, FileIcon, FolderIcon } from '../ui/FileIcon';
import { ContextMenu, type MenuItem } from '../ui/ContextMenu';

const DND = 'application/x-webstudio-path';

export function Explorer() {
  const project = useCurrentProject();
  const activePath = useStore((s) => s.activePath);
  const expanded = useStore((s) => s.expanded);
  const previewPath = useStore((s) => s.previewPath);
  const st = useStore.getState();

  const [menu, setMenu] = useState<{ x: number; y: number; target: string | null; type: 'file' | 'folder' | 'root' } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const importFolder = useRef('');

  if (!project) return null;
  const tree = buildTree(project.nodes);

  const folderFor = (path: string | null): string => {
    if (!path) return '';
    const n = project.nodes.find((x) => x.path === path);
    return n?.type === 'folder' ? path : dirname(path);
  };
  const baseFolder = () => folderFor(selected ?? activePath);

  const promptNew = (kind: 'file' | 'folder', folder: string) =>
    st.openDialog({
      kind: 'prompt',
      title: kind === 'file' ? 'New file' : 'New folder',
      label: folder ? `Name (inside ${folder}/)` : 'Name',
      initial: kind === 'file' ? 'untitled.html' : 'new-folder',
      confirmLabel: 'Create',
      validate: validateName,
      onSubmit: (name) => {
        const path = joinPath(folder, name);
        if (kind === 'file') useStore.getState().createFile(path);
        else useStore.getState().createFolder(path);
      },
    });

  const askDelete = (path: string, type: 'file' | 'folder') =>
    st.openDialog({
      kind: 'confirm',
      title: `Delete ${type}`,
      message: `Delete “${basename(path)}”${type === 'folder' ? ' and everything inside it' : ''}? This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => useStore.getState().deleteNode(path),
    });

  const startImport = (folder: string) => {
    importFolder.current = folder;
    fileInput.current?.click();
  };

  const menuItems = (): MenuItem[] => {
    if (!menu) return [];
    const { target, type } = menu;
    const folder = type === 'root' ? '' : type === 'folder' ? target! : dirname(target!);
    const common: MenuItem[] = [
      { label: 'New file…', icon: <FilePlus size={13} />, onClick: () => promptNew('file', folder) },
      { label: 'New folder…', icon: <FolderPlus size={13} />, onClick: () => promptNew('folder', folder) },
      { label: 'Import files here…', icon: <Upload size={13} />, onClick: () => startImport(folder) },
    ];
    if (type === 'root' || !target) return common;
    const isHtml = type === 'file' && /\.html?$/i.test(target);
    return [
      ...(type === 'file' ? [{ label: 'Open', onClick: () => useStore.getState().openFile(target) } as MenuItem] : []),
      ...(isHtml ? [{ label: 'Preview this page', onClick: () => useStore.setState({ previewPath: target }) } as MenuItem] : []),
      ...(type === 'file' ? [{ divider: true } as MenuItem] : []),
      ...common,
      { divider: true },
      { label: 'Rename', shortcut: 'F2', onClick: () => setRenaming(target) },
      { label: 'Copy path', onClick: () => void navigator.clipboard?.writeText(target) },
      { label: 'Delete', shortcut: 'Del', danger: true, onClick: () => askDelete(target, type) },
    ];
  };

  const onDropOn = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const internal = e.dataTransfer.getData(DND);
    if (internal) useStore.getState().moveNode(internal, folder);
    else if (e.dataTransfer.files.length) void useStore.getState().importFiles([...e.dataTransfer.files], folder);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (renaming || !selected) return;
    const node = project.nodes.find((n) => n.path === selected);
    if (!node) return;
    if (e.key === 'F2') {
      e.preventDefault();
      setRenaming(selected);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      askDelete(selected, node.type);
    } else if (e.key === 'Enter') {
      if (node.type === 'file') st.openFile(selected);
      else st.toggleFolder(selected);
    }
  };

  const renderRow = (item: TreeItem, depth: number): ReactNode => {
    const { node, name } = item;
    const isFolder = node.type === 'folder';
    const open = expanded[node.path] ?? false;
    const isActive = node.path === activePath;
    const isSel = node.path === selected;
    const isDrop = dropTarget === node.path;
    return (
      <Fragment key={node.path}>
        <div
          role="treeitem"
          aria-expanded={isFolder ? open : undefined}
          aria-selected={isActive}
          draggable={renaming !== node.path}
          title={node.path}
          onDragStart={(e) => {
            e.dataTransfer.setData(DND, node.path);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            if (!isFolder) return;
            e.preventDefault();
            e.stopPropagation();
            setDropTarget(node.path);
          }}
          onDragLeave={() => isDrop && setDropTarget(null)}
          onDrop={(e) => isFolder && onDropOn(e, node.path)}
          onClick={() => {
            setSelected(node.path);
            if (isFolder) st.toggleFolder(node.path);
            else st.openFile(node.path);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelected(node.path);
            setMenu({ x: e.clientX, y: e.clientY, target: node.path, type: node.type });
          }}
          style={{ paddingLeft: 8 + depth * 14 }}
          className={`flex h-[26px] cursor-pointer select-none items-center gap-1.5 pr-2 text-[13px] transition-colors ${isActive ? 'bg-ws-accent/20 text-ws-strong' : isSel ? 'bg-ws-hover text-ws-text' : 'text-ws-muted hover:bg-ws-hover hover:text-ws-text'} ${isDrop ? 'outline outline-1 -outline-offset-1 outline-ws-accent bg-ws-accent/10' : ''}`}
        >
          {isFolder ? <Chevron open={open} /> : <span className="w-3.5 shrink-0" />}
          {isFolder ? <FolderIcon open={open} /> : <FileIcon path={node.path} />}
          {renaming === node.path ? (
            <RenameInput
              initial={name}
              onDone={(v) => {
                setRenaming(null);
                if (v && v !== name) {
                  const np = useStore.getState().renameNode(node.path, v);
                  if (np) setSelected(np);
                }
              }}
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{name}</span>
          )}
          {!isFolder && node.path === previewPath && renaming !== node.path && (
            <span title="Currently previewed" className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          )}
        </div>
        {isFolder && open && item.children.map((c) => renderRow(c, depth + 1))}
      </Fragment>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col" onKeyDown={onKeyDown}>
      <div className="flex h-9 shrink-0 items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ws-muted">Explorer</span>
        <div className="flex">
          <button className="icon-btn" title="New file" onClick={() => promptNew('file', baseFolder())}><FilePlus size={14} /></button>
          <button className="icon-btn" title="New folder" onClick={() => promptNew('folder', baseFolder())}><FolderPlus size={14} /></button>
          <button className="icon-btn" title="Import files" onClick={() => startImport(baseFolder())}><Upload size={14} /></button>
          <button className="icon-btn" title="Collapse all" onClick={st.collapseAll}><ChevronsDownUp size={14} /></button>
        </div>
      </div>
      <div className="truncate border-y border-ws-border bg-ws-bg/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ws-text">{project.name}</div>
      <div
        role="tree"
        tabIndex={0}
        className={`min-h-0 flex-1 overflow-auto py-1 outline-none ${dropTarget === '' ? 'bg-ws-accent/5' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget('');
        }}
        onDragLeave={(e) => e.currentTarget === e.target && setDropTarget(null)}
        onDrop={(e) => onDropOn(e, '')}
        onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, target: null, type: 'root' });
        }}
      >
        {tree.map((item) => renderRow(item, 0))}
        {!tree.length && <p className="px-4 py-6 text-center text-xs text-ws-muted">This project is empty. Right-click to create a file.</p>}
      </div>
      <p className="shrink-0 border-t border-ws-border px-3 py-1.5 text-[10px] leading-snug text-ws-muted">Drag files to move them · drop files from your computer to import · F2 rename</p>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void useStore.getState().importFiles([...e.target.files], importFolder.current);
          e.target.value = '';
        }}
      />
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems()} onClose={() => setMenu(null)} />}
    </div>
  );
}

function RenameInput({ initial, onDone }: { initial: string; onDone: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initial);
  const [bad, setBad] = useState(false);
  const finished = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);
  const finish = (commit: boolean) => {
    if (finished.current) return;
    if (commit && validateName(value)) return setBad(true);
    finished.current = true;
    onDone(commit ? value.trim() : null);
  };
  return (
    <input
      ref={ref}
      value={value}
      aria-label="New name"
      onChange={(e) => { setValue(e.target.value); setBad(false); }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
      onBlur={() => finish(!validateName(value))}
      className={`min-w-0 flex-1 rounded border bg-ws-editor px-1 text-[13px] text-ws-text outline-none ${bad ? 'border-red-500' : 'border-ws-accent'}`}
    />
  );
}
