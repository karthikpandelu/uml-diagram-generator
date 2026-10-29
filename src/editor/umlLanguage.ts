// Lightweight regex-based syntax highlighting for the UML DSL.
// Avoids a full Lezer grammar — we just decorate tokens per visible line.

import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const keyword = Decoration.mark({ class: 'cm-uml-keyword' });
const comment = Decoration.mark({ class: 'cm-uml-comment' });
const operator = Decoration.mark({ class: 'cm-uml-operator' });
const vis = Decoration.mark({ class: 'cm-uml-visibility' });
const str = Decoration.mark({ class: 'cm-uml-string' });

const OPERATORS = ['--|>', '..|>', '*--', 'o--', '..>', '-->'];

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;

      // Comment: everything from // to end of line.
      const commentIdx = text.indexOf('//');
      const codeEnd = commentIdx === -1 ? text.length : commentIdx;

      // Leading keyword(s): `class`, `enum`, `interface`, or `abstract class`.
      const classMatch = /^(\s*)(abstract\s+class|class|enum|interface)\b/.exec(text.slice(0, codeEnd));
      if (classMatch) {
        const kw = classMatch[2];
        const start = line.from + classMatch[1].length;
        builder.add(start, start + kw.length, keyword);
      }

      // Visibility markers and operators + strings within the code portion.
      // Collect ranges then sort (RangeSetBuilder requires ascending order).
      const ranges: { from: number; to: number; deco: Decoration }[] = [];

      // strings "..."
      const strRe = /"[^"]*"/g;
      let m: RegExpExecArray | null;
      while ((m = strRe.exec(text.slice(0, codeEnd)))) {
        ranges.push({ from: line.from + m.index, to: line.from + m.index + m[0].length, deco: str });
      }

      // operators
      for (const op of OPERATORS) {
        let idx = text.indexOf(op);
        while (idx !== -1 && idx < codeEnd) {
          ranges.push({ from: line.from + idx, to: line.from + idx + op.length, deco: operator });
          idx = text.indexOf(op, idx + op.length);
        }
      }

      // visibility markers at token starts (+ - # ~ followed by a letter)
      const visRe = /(^|\s)([+\-#~])(?=[A-Za-z_])/g;
      while ((m = visRe.exec(text.slice(0, codeEnd)))) {
        const at = line.from + m.index + m[1].length;
        ranges.push({ from: at, to: at + 1, deco: vis });
      }

      ranges.sort((a, b) => a.from - b.from || a.to - b.to);
      for (const r of ranges) builder.add(r.from, r.to, r.deco);

      // comment
      if (commentIdx !== -1) {
        builder.add(line.from + commentIdx, line.to, comment);
      }

      pos = line.to + 1;
    }
  }

  return builder.finish();
}

const theme = EditorView.baseTheme({
  '.cm-uml-keyword': { color: '#7c3aed', fontWeight: '600' },
  '.cm-uml-comment': { color: '#94a3b8', fontStyle: 'italic' },
  '.cm-uml-operator': { color: '#dc2626', fontWeight: '600' },
  '.cm-uml-visibility': { color: '#2563eb', fontWeight: '700' },
  '.cm-uml-string': { color: '#059669' },
});

export function umlHighlight() {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged) {
          this.decorations = buildDecorations(u.view);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
  return [plugin, theme];
}
