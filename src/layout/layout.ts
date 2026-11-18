// Layout: turn a parsed Diagram into positioned boxes and routed edges using Dagre.

import dagre from '@dagrejs/dagre';
import type { ClassNode, Diagram, EnumNode, Relationship, Span } from '../dsl/ast';
import { VISIBILITY_SYMBOL } from '../dsl/ast';

// A rendered line of text paired with the source span that produced it, so the
// renderer can make it editable in place. `span` is absent when the piece can't
// be mapped back to the source (then it renders non-editable).
export interface Line {
  text: string;
  span?: Span;
}

export interface LaidOutClass {
  kind: 'class';
  node: ClassNode;
  x: number; // top-left
  y: number;
  width: number;
  height: number;
  headerHeight: number;
  nameSpan?: Span;
  fieldLines: Line[];
  methodLines: Line[];
}

export interface LaidOutEnum {
  kind: 'enum';
  node: EnumNode;
  x: number;
  y: number;
  width: number;
  height: number;
  headerHeight: number;
  nameSpan?: Span;
  values: Line[];
}

export type LaidOutNode = LaidOutClass | LaidOutEnum;

export interface Point {
  x: number;
  y: number;
}

export interface LaidOutEdge {
  rel: Relationship;
  points: Point[]; // polyline from `from` box to `to` box
}

export interface LaidOutDiagram {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
}

// Visual constants (kept here so the renderer and sizing stay in sync).
export const CHAR_WIDTH = 7.2; // approx px per char at 13px monospace
export const LINE_HEIGHT = 20;
export const PADDING_X = 12;
export const HEADER_PADDING_Y = 10;
export const COMPARTMENT_PADDING_Y = 6;
export const MIN_WIDTH = 100;
export const STEREOTYPE_HEIGHT = 16; // extra header space for «enumeration»

export const ENUM_STEREOTYPE = '«enumeration»';

export const CLASS_STEREOTYPE_LABEL: Record<'abstract' | 'interface', string> = {
  abstract: '«abstract»',
  interface: '«interface»',
};

export function memberLine(m: ClassNode['fields'][number]): string {
  const vis = VISIBILITY_SYMBOL[m.visibility];
  return `${vis} ${m.name}${m.type ? ': ' + m.type : ''}`;
}

export function methodLine(m: ClassNode['methods'][number]): string {
  const vis = VISIBILITY_SYMBOL[m.visibility];
  const params = m.params.map((p) => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ');
  return `${vis} ${m.name}(${params})${m.returnType ? ': ' + m.returnType : ''}`;
}

type ClassMetrics = Omit<LaidOutClass, 'x' | 'y' | 'node' | 'kind'>;
type EnumMetrics = Omit<LaidOutEnum, 'x' | 'y' | 'node' | 'kind'>;

function measure(cls: ClassNode): ClassMetrics {
  const fieldLines: Line[] = cls.fields.map((f) => ({ text: memberLine(f), span: f.span }));
  const methodLines: Line[] = cls.methods.map((m) => ({ text: methodLine(m), span: m.span }));

  const stereotypeLine = cls.stereotype ? CLASS_STEREOTYPE_LABEL[cls.stereotype] : undefined;
  const allLines = [
    cls.name,
    ...(stereotypeLine ? [stereotypeLine] : []),
    ...fieldLines.map((l) => l.text),
    ...methodLines.map((l) => l.text),
  ];
  const longest = allLines.reduce((max, l) => Math.max(max, l.length), 0);
  const width = Math.max(MIN_WIDTH, Math.ceil(longest * CHAR_WIDTH) + PADDING_X * 2);

  const headerHeight = LINE_HEIGHT + HEADER_PADDING_Y + (stereotypeLine ? STEREOTYPE_HEIGHT : 0);
  const fieldsHeight =
    fieldLines.length > 0
      ? fieldLines.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;
  const methodsHeight =
    methodLines.length > 0
      ? methodLines.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;
  const height = headerHeight + fieldsHeight + methodsHeight;

  return { width, height, headerHeight, nameSpan: cls.nameSpan, fieldLines, methodLines };
}

function measureEnum(en: EnumNode): EnumMetrics {
  const values: Line[] = en.values.map((v) => ({ text: v.name, span: v.span }));
  // The stereotype line and the name both live in the header.
  const allLines = [ENUM_STEREOTYPE, en.name, ...values.map((l) => l.text)];
  const longest = allLines.reduce((max, l) => Math.max(max, l.length), 0);
  const width = Math.max(MIN_WIDTH, Math.ceil(longest * CHAR_WIDTH) + PADDING_X * 2);

  const headerHeight = LINE_HEIGHT + HEADER_PADDING_Y + STEREOTYPE_HEIGHT;
  const valuesHeight =
    values.length > 0
      ? values.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;
  const height = headerHeight + valuesHeight;

  return { width, height, headerHeight, nameSpan: en.nameSpan, values };
}

export function layout(diagram: Diagram): LaidOutDiagram {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 70, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  const classMetrics = new Map<string, ClassMetrics>();
  const enumMetrics = new Map<string, EnumMetrics>();
  const known = new Set<string>();

  for (const cls of diagram.classes) {
    const m = measure(cls);
    classMetrics.set(cls.name, m);
    known.add(cls.name);
    g.setNode(cls.name, { width: m.width, height: m.height });
  }
  for (const en of diagram.enums) {
    const m = measureEnum(en);
    enumMetrics.set(en.name, m);
    known.add(en.name);
    g.setNode(en.name, { width: m.width, height: m.height });
  }

  for (const rel of diagram.relationships) {
    if (known.has(rel.from) && known.has(rel.to)) {
      // Dagre ranks an edge's source ABOVE its target (rankdir TB). For
      // inheritance/realization the UML arrow points child → parent, so feeding
      // it to Dagre as-is would rank the child on top. Reverse those two kinds so
      // the supertype (interface, then abstract base) sits above its subtypes —
      // the conventional top-down class hierarchy. The drawn edge is unaffected
      // (arrowheads/polyline come from `diagram.relationships`, not this graph).
      if (rel.kind === 'inheritance' || rel.kind === 'realization') {
        g.setEdge(rel.to, rel.from);
      } else {
        g.setEdge(rel.from, rel.to);
      }
    }
  }

  dagre.layout(g);

  const nodes: LaidOutNode[] = [];
  for (const cls of diagram.classes) {
    const m = classMetrics.get(cls.name)!;
    const n = g.node(cls.name);
    // Dagre gives center coordinates; convert to top-left.
    nodes.push({ kind: 'class', node: cls, x: n.x - m.width / 2, y: n.y - m.height / 2, ...m });
  }
  for (const en of diagram.enums) {
    const m = enumMetrics.get(en.name)!;
    const n = g.node(en.name);
    nodes.push({ kind: 'enum', node: en, x: n.x - m.width / 2, y: n.y - m.height / 2, ...m });
  }

  const edges: LaidOutEdge[] = diagram.relationships
    .filter((rel) => known.has(rel.from) && known.has(rel.to))
    .map((rel) => {
      // Inheritance/realization were inserted reversed (see above), so look them
      // up by the reversed key and flip the returned polyline back to child→parent
      // so the arrowhead still lands on the parent end.
      const reversed = rel.kind === 'inheritance' || rel.kind === 'realization';
      const e = reversed ? g.edge(rel.to, rel.from) : g.edge(rel.from, rel.to);
      let points: Point[] = (e?.points ?? []).map((p) => ({ x: p.x, y: p.y }));
      if (reversed) points = points.slice().reverse();
      return { rel, points };
    });

  const graph = g.graph();
  return {
    nodes,
    edges,
    width: graph.width ?? 800,
    height: graph.height ?? 600,
  };
}
