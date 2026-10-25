# UML Class Diagram Platform — Build Plan

A client-side web app (like sequencediagram.org, but for UML **class diagrams**) where a
user types a text description and sees a live-rendered diagram. Supports saving the diagram
as an image, saving the source as a `.txt` file, and opening a `.txt` file to render it.

---

## 1. Decisions (locked)

| Decision          | Choice                                                           |
| ----------------- | ---------------------------------------------------------------- |
| Diagram scope     | UML **class diagrams only** for v1                               |
| Text language     | **Custom DSL** (Mermaid-like syntax), we own the grammar         |
| Layout/rendering  | Custom DSL → AST → **auto-layout library** → SVG                 |
| Deployment        | **Client-side only** — no backend, no accounts                   |
| Preview           | **Live** (debounced re-render as you type)                       |
| Save/open         | Save PNG + SVG image; save `.txt`; open `.txt`                   |

---

## 2. Tech stack

| Concern        | Choice                                   | Why                                                       |
| -------------- | ---------------------------------------- | --------------------------------------------------------- |
| Language       | **TypeScript**                           | Type-safe parser/AST                                      |
| Framework      | **React 18 + Vite**                      | Fast dev/HMR, easy SVG via JSX                            |
| Editor         | **CodeMirror 6**                         | Lightweight editor + custom syntax highlighting           |
| Parser         | **Hand-written** tokenizer + recursive-descent | Full control of DSL, good error messages            |
| Auto-layout    | **Dagre** (`@dagrejs/dagre`)             | Simple, solid for layered class diagrams (ELK.js as backup for complex graphs) |
| Rendering      | **SVG** (React components)               | Crisp, vector, directly exportable                        |
| PNG export     | **html-to-image**                        | Serializes the SVG/DOM node to PNG reliably               |
| SVG export     | Native (serialize the `<svg>`)           | True vector output                                        |
| File save/open | **File System Access API** + `<a download>` / `<input type=file>` fallback | Open/save `.txt` + images cross-browser |
| Styling        | **Tailwind CSS**                         | Fast, consistent UI                                       |
| State          | **Zustand** (or React context)           | Minimal global state (source text, AST, errors)           |

> Fallback note: if Dagre's edge routing proves limiting for aggregation/composition
> self-loops or many-to-many links, swap the layout module to **ELK.js** — the AST→layout
> boundary is isolated so this is a contained change.

---

## 3. The DSL (v1 spec)

### 3.1 Class definition
```
class User {
  +id: int
  -name: string
  #createdAt: date
  +login(password: string): bool
  +logout()
}
```
- `+` public, `-` private, `#` protected, `~` package (optional).
- Fields: `visibility name: type`.
- Methods: `visibility name(params): returnType` — params and return type optional.
- An empty class is allowed: `class Admin` (no braces).

### 3.2 Relationships
| Syntax          | Meaning       | Arrowhead                          |
| --------------- | ------------- | ---------------------------------- |
| `A --|> B`      | Inheritance   | hollow triangle pointing to B      |
| `A ..|> B`      | Realization   | dashed + hollow triangle           |
| `A --> B`       | Association   | open arrow                         |
| `A *-- B`       | Composition   | filled diamond at A                |
| `A o-- B`       | Aggregation   | hollow diamond at A                |
| `A ..> B`       | Dependency    | dashed open arrow                  |

### 3.3 Multiplicity & labels
```
User "1" --> "*" Order : places
```
- Optional `"mult"` before/after the arrow.
- Optional `: label` for the relationship name.

### 3.4 Comments
- `// line comment` ignored by the parser.

### 3.5 Example source
```
class User {
  +id: int
  -name: string
  +login(pw: string): bool
}

class Admin
Admin --|> User          // inheritance
User "1" --> "*" Order   // association
Order *-- LineItem        // composition
Cart o-- Product          // aggregation
User ..> Logger           // dependency
```

---

## 4. Architecture / data flow

```
  CodeMirror editor
        │  (debounced onChange)
        ▼
   source text ──► tokenizer ──► parser ──► AST ──┬──► error list (inline markers)
                                                  │
                                                  ▼
                                          layout (Dagre): positions + edge paths
                                                  │
                                                  ▼
                                          SVG renderer (React)
                                                  │
                        ┌─────────────────────────┼─────────────────────────┐
                        ▼                          ▼                         ▼
                   PNG export               SVG export                 (pan / zoom)
```

### AST shape (TypeScript)
```ts
interface ClassNode {
  name: string;
  fields: Member[];      // { visibility, name, type }
  methods: Method[];     // { visibility, name, params, returnType }
}
interface Relationship {
  from: string; to: string;
  kind: 'inheritance'|'realization'|'association'|'composition'|'aggregation'|'dependency';
  fromMult?: string; toMult?: string; label?: string;
}
interface Diagram { classes: ClassNode[]; relationships: Relationship[]; }
interface ParseError { line: number; col: number; message: string; }
```

---

## 5. Project structure
```
uml-diagram/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js
└─ src/
   ├─ main.tsx
   ├─ App.tsx                 # split-pane layout
   ├─ dsl/
   │  ├─ tokenizer.ts
   │  ├─ parser.ts
   │  ├─ ast.ts               # types
   │  └─ __tests__/parser.test.ts
   ├─ layout/
   │  └─ layout.ts            # AST -> positioned nodes/edges (Dagre)
   ├─ render/
   │  ├─ DiagramCanvas.tsx    # <svg> root, pan/zoom
   │  ├─ ClassBox.tsx         # 3-compartment class box
   │  └─ Edge.tsx             # relationship lines + arrowheads/diamonds
   ├─ editor/
   │  └─ Editor.tsx           # CodeMirror + custom highlighting + error markers
   ├─ io/
   │  ├─ fileio.ts            # open/save .txt (File System Access API + fallback)
   │  └─ export.ts            # PNG (html-to-image) + SVG export
   ├─ state/
   │  └─ store.ts             # Zustand: source, ast, errors
   └─ examples/
      └─ default.txt          # starter diagram shown on first load
```

---

## 6. Phased build order

### Phase 0 — Scaffold
- Vite + React + TS + Tailwind; split-pane shell (editor left, canvas right); top toolbar
  stub (Open / Save Text / Save Image).

### Phase 1 — DSL + parser  ⭐ core
- Tokenizer → recursive-descent parser → typed AST.
- Collect `ParseError`s (don't throw) so a partial/invalid doc still renders what it can.
- Unit tests for classes, members, each relationship kind, multiplicity, comments.

### Phase 2 — Layout + SVG render
- `layout.ts`: feed AST to Dagre, get node positions + edge polylines.
- `ClassBox`: three compartments (name / fields / methods), auto-sized to text.
- `Edge`: draw line, dashed vs solid, correct arrowhead/diamond per kind, multiplicity + label text.

### Phase 3 — Live preview
- Wire CodeMirror → store → debounced (~250 ms) reparse/relayout/rerender.
- Show parse errors as inline gutter markers + a small error panel.

### Phase 4 — Save / Open
- **Save Text**: write current source to `.txt`.
- **Save Image**: export canvas as **PNG** (html-to-image) and **SVG**.
- **Open**: pick a `.txt`, load into editor → auto-renders.
- Use File System Access API where available; fall back to download link + file input.

### Phase 5 — Polish
- Custom syntax highlighting for the DSL in CodeMirror.
- Pan + zoom (and "fit to screen") on the canvas.
- Example templates dropdown; localStorage autosave of last document.
- Nicer error toasts; keyboard shortcuts (Ctrl/Cmd+S save text, Ctrl/Cmd+Shift+S save image).

---

## 7. Stretch (post-v1, not now)
- Additional UML diagram types (sequence, use-case, state) — DSL/renderer designed to be extensible.
- Shareable URL (encode source in the hash).
- Drag-to-reposition boxes with manual layout overrides.
- Dark mode.

---

## 8. Open defaults I chose for you (flag if you disagree)
- **Dagre** over ELK for v1 (simpler); isolated so it's swappable.
- **html-to-image** for PNG export.
- **Zustand** for state (could be plain context).
- Debounce interval **250 ms**.
