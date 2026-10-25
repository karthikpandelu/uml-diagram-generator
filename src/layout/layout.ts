// Layout: turn a parsed Diagram into positioned boxes and routed edges using Dagre.

import dagre from '@dagrejs/dagre';
import type { ClassNode, Diagram, Relationship } from '../dsl/ast';
import { VISIBILITY_SYMBOL } from '../dsl/ast';

export interface LaidOutClass {
  node: ClassNode;
  x: number; // top-left
  y: number;
  width: number;
  height: number;
  headerHeight: number;
  fieldLines: string[];
  methodLines: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface LaidOutEdge {
  rel: Relationship;
  points: Point[]; // polyline from `from` box to `to` box
}

export interface LaidOutDiagram {
  classes: LaidOutClass[];
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

export function memberLine(m: ClassNode['fields'][number]): string {
  const vis = VISIBILITY_SYMBOL[m.visibility];
  return `${vis} ${m.name}${m.type ? ': ' + m.type : ''}`;
}

export function methodLine(m: ClassNode['methods'][number]): string {
  const vis = VISIBILITY_SYMBOL[m.visibility];
  const params = m.params
    .map((p) => `${p.name}${p.type ? ': ' + p.type : ''}`)
    .join(', ');
  return `${vis} ${m.name}(${params})${m.returnType ? ': ' + m.returnType : ''}`;
}

function measure(cls: ClassNode): Omit<LaidOutClass, 'x' | 'y' | 'node'> {
  const fieldLines = cls.fields.map(memberLine);
  const methodLines = cls.methods.map(methodLine);

  const allLines = [cls.name, ...fieldLines, ...methodLines];
  const longest = allLines.reduce((max, l) => Math.max(max, l.length), 0);
  const width = Math.max(MIN_WIDTH, Math.ceil(longest * CHAR_WIDTH) + PADDING_X * 2);

  const headerHeight = LINE_HEIGHT + HEADER_PADDING_Y;
  const fieldsHeight =
    fieldLines.length > 0
      ? fieldLines.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;
  const methodsHeight =
    methodLines.length > 0
      ? methodLines.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;
  const height = headerHeight + fieldsHeight + methodsHeight;

  return { width, height, headerHeight, fieldLines, methodLines };
}

export function layout(diagram: Diagram): LaidOutDiagram {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 70, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  const measured = new Map<string, Omit<LaidOutClass, 'x' | 'y' | 'node'>>();
  for (const cls of diagram.classes) {
    const m = measure(cls);
    measured.set(cls.name, m);
    g.setNode(cls.name, { width: m.width, height: m.height });
  }

  for (const rel of diagram.relationships) {
    if (measured.has(rel.from) && measured.has(rel.to)) {
      g.setEdge(rel.from, rel.to);
    }
  }

  dagre.layout(g);

  const classes: LaidOutClass[] = diagram.classes.map((cls) => {
    const m = measured.get(cls.name)!;
    const n = g.node(cls.name);
    // Dagre gives center coordinates; convert to top-left.
    return {
      node: cls,
      x: n.x - m.width / 2,
      y: n.y - m.height / 2,
      ...m,
    };
  });

  const edges: LaidOutEdge[] = diagram.relationships
    .filter((rel) => measured.has(rel.from) && measured.has(rel.to))
    .map((rel) => {
      const e = g.edge(rel.from, rel.to);
      const points: Point[] = (e?.points ?? []).map((p) => ({ x: p.x, y: p.y }));
      return { rel, points };
    });

  const graph = g.graph();
  return {
    classes,
    edges,
    width: graph.width ?? 800,
    height: graph.height ?? 600,
  };
}
