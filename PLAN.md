# `/library` — Plan & Status

A local-first browser for image, PDF, markdown and document collections (e.g. the Ultimate Maps Bundle). All file access happens in the browser; nothing is uploaded. Lives as a self-contained page at `/library` inside BeforeAftr — the rest of the app is untouched.

## Goals (original brief)

- Pick a folder on disk; recursive scan of images, PDFs, docs, markdown
- Tree view + viewer split, tree collapsible to near-full-width
- Multiple gallery views: current directory and recursive whole-library
- Auto-tag files based on parent folder names — strip leading counts like `350+`, singularize, but skip pure-numeric folders (years)
- Persist the index in IndexedDB so the library survives reloads
- "Plex for images" feel — clean, modern, intuitive

## What shipped

### Step 1 — Scaffolding
- `/library` route, fully client-side; no edits to `next.config.ts`, root layout, or `magnepixit/`
- File System Access API (Chromium) with `<input webkitdirectory>` fallback (Firefox/Safari)
- Branded pre-flight modal in front of the browser's unavoidable native prompts
- Recursive directory scan via unified `fs-adapter`
- Tree with chevron expand, indent guides, hover/select states
- Hybrid sidebar: expanded (280px) ↔ rail (48px) with peek-on-hover ↔ hidden (0px, true full-width)

### Step 2 — Viewers
- Image (fit / actual, `f` shortcut)
- PDF via `pdfjs-dist` — page nav, devicePixelRatio-aware, re-renders on container resize
- Markdown via `marked` + `dompurify`
- `.docx` via `mammoth` + `dompurify` (other doc formats fall through to unsupported)
- Plain text (monospace preformatted)
- Gallery for directory selection — lazy-loaded thumbnails via IntersectionObserver, current-directory and recursive modes
- All heavy libs loaded via dynamic import (PDF / markdown / docx ~500kB each, only fetched when first opened)

### Step 3 — Auto-tagging + filter bar
- Tag derivation: strip leading count prefix only when the remainder has letters; skip pure-numeric folders; singularize trailing word
- Plural rules: `-ies` → `-y`, `-es` after `s/x/z/ch/sh`, `-oes` → strip `-es`, plain `-s` (skipped for `-ss`/`-us`/`-is`/`-os`). Will mis-singularize `-ves` words (e.g. "Wolves" → "Wolve")
- Tag chips in gallery filter bar (AND) and in shell header for the selected file
- Active filters persist across navigation; "Clear filters" empty-state action

### Step 4 — IndexedDB persistence (Dexie)
- Persisted: directory handle, scan index, sidebar state, expanded tree paths, last selected path, active tag filters, gallery recursive toggle
- Boot flow: silent restore if permission still granted; "Reopen [name]" CTA if the browser revoked it
- Webkitdirectory users don't persist (File blobs not worth storing) — they re-pick each session
- All DB ops fail soft on private-mode / quota errors

### Polish pass
- Full-width mode (Cmd/Ctrl+Shift+\) with floating reopen button when hidden
- Auto-select root after first pick (gallery appears immediately)
- Selected tree node scrolls into view on selection change
- Header tag-chip overflow fade
- Image viewer `f` shortcut
- PDF re-renders on container resize (so it scales when sidebar collapses)

## Design constraints

- **Monochrome.** No teal or colored accents. White-on-black opacity layers (`bg-white/[0.04]`, `bg-white/[0.08]`, `bg-white/60`). Inverse-fill primary buttons (`bg-white text-black`).
- **Gold `#F5BE63` is status-only** — PDF badge, favorites, "new". Never a CTA fill.
- **Soft red `#E86F6F`** for destructive/error only.
- **Motion: 200ms `cubic-bezier(0.16,1,0.3,1)`** (Linear's ease-out-expo) for structural transitions. Hover/press 120ms ease-out. Never animate during drag or scroll.
- **Canvas `#0E0F11`** — one notch darker than root `neutral-900` for depth.
- **Typography: Outfit** (already loaded via root layout). 500 for nav/titles, 400 body, uppercase micro-labels (`text-[11px] tracking-[0.08em]`) for section headers.
- **Density: comfortable** — 32px tree rows, 8px gallery gaps, 24px gutters.
- **Modals over native prompts.** Browser prompts (OS folder picker, FS Access permission, Firefox/Safari "Confirm upload") are unavoidable but framed by our pre-flight modal.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `Cmd/Ctrl + \` | Toggle sidebar expanded ↔ rail |
| `Cmd/Ctrl + Shift + \` | Toggle hidden ↔ previous (true full-width) |
| `f` | Image viewer: toggle fit / actual size |
| `Esc` | Close modal |

## Browser support

| Browser | Picker | Persistence | Notes |
|---|---|---|---|
| Chrome / Edge / Brave / Arc | FS Access API | Full | Cleanest experience |
| Firefox | webkitdirectory | None | Re-pick each session; shows misleading "Confirm upload" prompt |
| Safari | webkitdirectory | None | Same as Firefox |

## File map

```
src/app/library/
  page.tsx                        client entry

src/components/library/
  library-shell.tsx               state owner, persistence, keyboard shortcuts
  sidebar.tsx                     three-state collapse + peek-on-hover
  tree.tsx · tree-node.tsx        tree view
  directory-picker.tsx            picker with Reopen flow + pre-flight modal
  modal.tsx                       generic dialog
  tag-chip.tsx                    reusable pill
  gallery/
    gallery.tsx · gallery-tile.tsx
    tag-filter-bar.tsx
  viewer/
    viewer.tsx                    router by file kind
    image-viewer.tsx
    pdf-viewer.tsx
    markdown-viewer.tsx
    doc-viewer.tsx
    text-viewer.tsx
    unsupported-viewer.tsx
    rich-content.tsx              shared typography for markdown/docx output
    viewer-skeleton.tsx           shared loading + error UI

src/lib/library/
  types.ts                        LibraryEntry, LibraryNode, ScanResult
  browser-capabilities.ts         FS Access vs webkitdirectory detection
  file-kinds.ts                   extension → FileKind map
  fs-adapter.ts                   unified scan
  tree-builder.ts                 flat → nested + findNodeByPath + countFiles
  tagging.ts                      deriveTagsFromPath + singularize
  use-file.ts                     useObjectUrl, useFileText, useFileBuffer
  db.ts                           Dexie schema
  persistence.ts                  save/load/clear + permission helpers

public/pdfjs.worker.min.mjs       copied from node_modules; required for offline PDF rendering
```

Runtime deps added: `pdfjs-dist`, `marked`, `mammoth`, `dompurify`, `dexie`.

## Deferred / future work

### Probably want soon
- **Search** across the library (filename + tag)
- **Manual tag overrides** — add/remove tags, persist them
- **OR semantics for tag filter** (Alt+click on chip) — specced but currently AND-only
- **Refresh / re-scan** action to pick up filesystem changes without losing state

### Polish nice-to-haves
- **Tree keyboard navigation** (arrow keys, Home/End, Enter)
- **Drag-resize sidebar** with snap points at 240 / 320 / 480 px
- **True justified-rows gallery** (Flickr-style) — current is uniform-height with variable width
- **PDF page thumbnails** in gallery tiles (currently a generic icon + gold "PDF" pill)
- **Cmd +/- / Cmd 0** zoom in image viewer (in addition to `f`)
- **Markdown relative image refs** — `![alt](map.png)` doesn't resolve to library files yet

### Performance
- **Gallery virtualization** for very large directories (>1000 tiles) — IntersectionObserver lazy-loading is fine for hundreds; will need `react-virtuoso` or similar past that
- **Thumbnail caching** in IndexedDB (regenerated each session today)

### Stretch
- **Multiple saved libraries** (currently a single "current" record)
- **Export tag taxonomy** as JSON for reuse / sharing

## Off-limits

These coexist with `/library` and must stay untouched unless explicitly asked:

- `magnepixit/` — dormant feature; user needs its templating system later
- Supabase wiring (`src/middleware.ts`, `src/utils/supabase/`, `database.types.ts`, `supabase/`) — wired but unused. Future update requires Next 16 + `middleware.ts` → `proxy.ts` rename (a Next 16 convention, not a Supabase one)
- `next.config.ts`, root `src/app/layout.tsx`, `tailwind.config.ts` — `/library` was specifically built to coexist without touching these
