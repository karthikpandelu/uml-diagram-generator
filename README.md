# UML Diagram Generator

**🔗 Live app: <https://uml-diagram-generator-urh.pages.dev/>**

A browser-based application for creating **UML class diagrams** from a simple
text description.

Type classes, their fields and methods, and the relationships between them in a
compact text DSL, and the diagram renders in real time. Save your work as text,
reopen it later, or export the diagram as an image.

Everything runs **client-side in the browser** — no backend, no accounts, no
data leaves your machine.

---

## Features

- **Text-driven class diagrams** — define classes with fields and methods using
  a concise, Mermaid-like DSL.
- **Visibility modifiers** — `+` public, `-` private, `#` protected, `~` package.
- **Methods with parameters and return types**, and typed fields.
- **Six relationship kinds**, each rendered with the correct UML marker:
  inheritance, realization, association, composition, aggregation, dependency.
- **Multiplicities and edge labels** on relationships
  (e.g. `User "1" --> "*" Order : places`).
- **Live preview** — the diagram re-renders as you type.
- **Automatic layout** — boxes are positioned and edges routed automatically
  (via Dagre); no manual placement needed.
- **Interactive canvas** — pan by dragging, zoom with the scroll wheel, and a
  reset button to recenter.
- **Resizable split pane** between the editor and the diagram.
- **Syntax highlighting** in the editor for keywords, operators, visibility
  markers, strings, and comments.
- **Forgiving parser** — invalid lines are reported with `line:col` positions in
  an inline error panel, while the valid parts of the document still render.
- **Built-in help dialog** documenting the full DSL syntax.
- **Save / open / export**:
  - Save the source as a `.txt` file.
  - Open a `.txt` file to load and render it.
  - Export the diagram as **PNG** (raster) or **SVG** (vector).
- **Keyboard shortcuts** — `Cmd/Ctrl+S` saves the text; `Cmd/Ctrl+Shift+S`
  exports a PNG.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (developed on Node 22)
- npm

### Install & run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default: <http://localhost:5173>).

### Other scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload         |
| `npm run build`     | Type-check and build for production (`dist/`) |
| `npm run preview`   | Preview the production build locally         |
| `npm test`          | Run the parser unit tests (Vitest)           |
| `npm run test:watch`| Run tests in watch mode                      |

---

## The DSL

### Defining a class

List fields and methods inside `{ }`. A class with no members needs no braces.

```
class User {
  +id: int
  -name: string
  #createdAt: date
  +login(password: string): bool
  +logout()
}

class Admin
```

- **Fields**: `visibility name: type` — the `: type` is optional.
- **Methods**: `visibility name(params): returnType` — params and return type are
  optional; each param is `name: type`.
- **Visibility**: `+` public, `-` private, `#` protected, `~` package.
  Defaults to public if omitted.

### Relationships

| Syntax       | Meaning      | Marker                          |
| ------------ | ------------ | ------------------------------- |
| `A --\|> B`  | Inheritance  | hollow triangle pointing at B   |
| `A ..\|> B`  | Realization  | dashed line + hollow triangle   |
| `A --> B`    | Association  | open arrowhead                  |
| `A *-- B`    | Composition  | filled diamond at A             |
| `A o-- B`    | Aggregation  | hollow diamond at A             |
| `A ..> B`    | Dependency   | dashed line + open arrowhead    |

### Multiplicity and labels

Add quoted multiplicities around the arrow and an optional `: label` at the end:

```
User "1" --> "*" Order : places
```

### Comments

Anything after `//` on a line is ignored.

### Full example

```
class User {
  +id: int
  +login(pw: string): bool
}
class Admin
class Order

Admin --|> User                  // inheritance
User "1" --> "*" Order : places   // association
Order *-- LineItem                // composition
```

Classes referenced in a relationship but never declared (like `LineItem` above)
are created automatically as empty boxes.

---

## Tech stack

| Concern        | Choice                                         |
| -------------- | ---------------------------------------------- |
| Language       | TypeScript                                     |
| Framework      | React 18 + Vite                                |
| Editor         | CodeMirror 6 (with custom syntax highlighting) |
| Parser         | Hand-written tokenizer + recursive-descent     |
| Auto-layout    | Dagre (`@dagrejs/dagre`)                        |
| Rendering      | SVG                                            |
| Image export   | `html-to-image` (PNG), native serialization (SVG) |
| File save/open | File System Access API, with download/upload fallback |
| State          | Zustand                                        |
| Styling        | Tailwind CSS                                   |
| Tests          | Vitest                                         |

---

## Project structure

```
src/
├─ App.tsx                 # toolbar, layout, keyboard shortcuts
├─ main.tsx                # entry point
├─ index.css               # Tailwind + base styles
├─ dsl/
│  ├─ ast.ts               # AST type definitions
│  ├─ parser.ts            # text -> AST (collects errors, never throws)
│  └─ __tests__/parser.test.ts
├─ layout/
│  └─ layout.ts            # AST -> positioned boxes + routed edges (Dagre)
├─ render/
│  ├─ DiagramCanvas.tsx    # SVG root, pan/zoom, error panel
│  ├─ ClassBox.tsx         # three-compartment class box
│  └─ Edge.tsx             # relationship lines + arrowheads/diamonds
├─ editor/
│  ├─ Editor.tsx           # CodeMirror editor wired to the store
│  └─ umlLanguage.ts       # DSL syntax highlighting
├─ io/
│  ├─ fileio.ts            # open/save .txt
│  └─ export.ts            # export PNG / SVG
├─ state/
│  └─ store.ts             # Zustand store: source + parsed diagram
└─ examples/
   └─ default.ts           # starter diagram shown on first load
```

### How it works

```
Editor (CodeMirror)
    │  debounced edits
    ▼
source text ──► parser ──► AST ──┬──► error list (inline panel)
                                 │
                                 ▼
                         Dagre layout (positions + edge paths)
                                 │
                                 ▼
                         SVG renderer ──► PNG / SVG export
```

---

## Deployment

The app is deployed on **Cloudflare Pages**:

<https://uml-diagram-generator-urh.pages.dev/>

It is a static client-side build (`npm run build` → `dist/`). Cloudflare Pages
is connected to this GitHub repository and **automatically rebuilds and deploys
on every push to `main`**. Build settings:

- Framework preset: React (Vite)
- Build command: `npm run build`
- Build output directory: `dist`

---

## License

This project is for personal/educational use.
