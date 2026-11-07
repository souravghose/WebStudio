# WebStudio

A VS Code-inspired online IDE for **HTML, CSS and JavaScript** that runs entirely in the browser — write code with Monaco Editor, manage files and projects, and see the result instantly in a live, sandboxed preview. No backend, no account, nothing uploaded: projects are stored locally in IndexedDB.

> This is the React + TypeScript upgrade of the original single-file WebStudio. Existing projects saved by the old version (`localStorage`) are migrated automatically on first load.

## Features

- **Monaco Editor** — syntax highlighting, IntelliSense, bracket matching & colouring, folding, minimap, find/replace, multi-tab editing, dirty-file indicators, auto-closing brackets and HTML tags, linked tag editing, word wrap, font-size controls, `Ctrl+Wheel` zoom. HTML, CSS, JavaScript, JSON, TypeScript and Markdown.
- **Prettier formatting** — toolbar button, `Alt+Shift+F`, and the editor's *Format Document* command; optional format-on-save.
- **Live preview** — sandboxed `<iframe>`, debounced auto-update, manual refresh, fullscreen, open in new tab, desktop / tablet / mobile viewports, multi-page projects (relative links navigate inside the preview), helpful empty state.
- **Developer panel** — *Console* (timestamps, errors with clickable `file:line`, REPL that evaluates inside the preview), *Problems* (live diagnostics from the HTML/CSS/JS/JSON language services, click to jump), *Output* (save/format/import messages), *Terminal* (see limitations).
- **File explorer** — create / rename / delete files and folders, drag-and-drop moving, import from your computer (button or drop), right-click menu, file-type icons, `F2` / `Del` shortcuts.
- **Search across files** — case, whole-word and regex options, grouped results, replace in file / replace all.
- **Projects** — create, open, rename, duplicate, delete, import & export **ZIP**, autosave with a visible indicator.
- **8 working starter templates** — Blank, Portfolio, Landing Page, Business, Dashboard, Login, E-commerce, Responsive.
- **Resizable layout** — drag splitters for sidebar, editor/preview and bottom panel; editor-only / preview-only / split views; responsive on phones.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · `@monaco-editor/react` + Monaco (bundled locally, works offline) · Zustand · IndexedDB · Prettier · JSZip · Lucide icons.

## Getting started

Requires **Node.js 20.19+** (22 recommended — see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + S` | Save project |
| `Ctrl + Shift + S` | Export project as ZIP |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `Ctrl + F` / `Ctrl + H` | Find / Replace in file |
| `Ctrl + Shift + F` | Search across files |
| `Alt + Shift + F` | Format document |
| `Ctrl + Enter` | Run / refresh preview |
| `Ctrl + B` | Toggle sidebar |
| ``Ctrl + ` `` | Toggle bottom panel |

Use `⌘` instead of `Ctrl` on macOS.

## Project structure

```
src/
  App.tsx                 layout shell, splitters, global effects
  components/             TopBar, ActivityBar, Sidebar, EditorArea, PreviewPane, BottomPanel, StatusBar, dialogs
    sidebar/              Explorer, SearchPanel, ProjectsPanel, TemplatesPanel, ExtensionsPanel, SettingsPanel
    ui/                   Splitter, ContextMenu, Dropdown, file icons
  store/useStore.ts       Zustand store: projects, files, tabs, settings, console, autosave
  lib/
    db.ts                 IndexedDB wrapper
    preview.ts            builds the sandboxed preview document + error-line mapping
    monacoSetup.ts        bundled Monaco, workers, theme, Prettier formatting providers
    templates.ts          registry for src/templates/*
    format.ts  zip.ts  paths.ts  actions.ts  editorBridge.ts  legacy.ts
  templates/              the 8 starter projects (real HTML/CSS/JS files)
```

## How the preview stays safe

Project code runs in an `<iframe srcdoc>` with `sandbox="allow-scripts allow-forms allow-modals allow-popups"` and **without** `allow-same-origin`. It therefore has an opaque origin: it cannot read the app's DOM, IndexedDB, `localStorage` or cookies, even if you import a ZIP from someone else. The only channel back to the app is `postMessage` for console output and navigation, and the app accepts only messages from that exact frame carrying a per-run random token. "Open in new tab" wraps the project in the same kind of sandboxed frame.

Consequence: inside the preview, `localStorage`/`sessionStorage`/cookies are unavailable (they throw). Guard them with `try/catch`, as the e-commerce template does.

## Known limitations

- **No real terminal.** WebStudio is a static site with no execution backend, so the Terminal tab explains this instead of faking a shell. The Console tab is a browser console for the preview, not a system shell.
- **React / JSX / npm** are not compiled yet — the architecture (virtual file tree, preview builder, Monaco language setup) is structured so they can be added.
- **Data lives in one browser.** Clearing site data deletes projects; export ZIPs to back up. Two tabs editing the same project overwrite each other (the last save wins; a notice is shown).
- Preview pages can load libraries from CDNs via `<script src="https://…">`, but only while online.

## Deploying

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for GitHub Pages (workflow included), Netlify, Vercel, Cloudflare Pages, Docker/VPS and custom-domain instructions.
