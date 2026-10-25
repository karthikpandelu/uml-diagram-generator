// Parser for the UML class-diagram DSL.
//
// The language is line-oriented. Each statement is either:
//   - a class definition:   class Name { ... }   or   class Name
//   - a relationship:       A --|> B,  A "1" --> "*" B : label, etc.
//   - a comment:            // ...        (also allowed at end of a line)
//   - blank
//
// The parser never throws: it collects ParseErrors so an invalid document
// still renders whatever could be understood.

import type {
  ClassNode,
  Diagram,
  Member,
  Method,
  Param,
  ParseError,
  Relationship,
  RelationshipKind,
  Visibility,
} from './ast';

const VISIBILITY: Record<string, Visibility> = {
  '+': 'public',
  '-': 'private',
  '#': 'protected',
  '~': 'package',
};

// Relationship operators, longest-match first so e.g. `..|>` wins over `..>`.
// Each maps the raw arrow to a kind. Direction/semantics are normalized in
// parseRelationship (composition/aggregation diamonds sit at the `from` side).
const REL_OPERATORS: { op: string; kind: RelationshipKind }[] = [
  { op: '--|>', kind: 'inheritance' },
  { op: '..|>', kind: 'realization' },
  { op: '*--', kind: 'composition' },
  { op: 'o--', kind: 'aggregation' },
  { op: '..>', kind: 'dependency' },
  { op: '-->', kind: 'association' },
];

// Strip a trailing `// comment` that is not inside quotes.
function stripComment(line: string): string {
  let inQuote = false;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (c === '"') inQuote = !inQuote;
    else if (!inQuote && c === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parse(source: string): Diagram {
  const classes: ClassNode[] = [];
  const relationships: Relationship[] = [];
  const errors: ParseError[] = [];
  const classIndex = new Map<string, ClassNode>();

  const rawLines = source.split('\n');
  let i = 0;

  const err = (line: number, col: number, message: string) =>
    errors.push({ line: line + 1, col: col + 1, message });

  // Ensure a class exists in the index (relationships may reference classes
  // that are not explicitly declared — we create a stub so they still render).
  const ensureClass = (name: string): ClassNode => {
    let c = classIndex.get(name);
    if (!c) {
      c = { name, fields: [], methods: [] };
      classIndex.set(name, c);
      classes.push(c);
    }
    return c;
  };

  while (i < rawLines.length) {
    const lineNo = i;
    const raw = stripComment(rawLines[i]);
    const text = raw.trim();

    if (text === '') {
      i++;
      continue;
    }

    // ---- class definition ----
    if (text.startsWith('class ') || text === 'class') {
      const rest = text.slice(5).trim();
      const braceIdx = rest.indexOf('{');
      const name = (braceIdx === -1 ? rest : rest.slice(0, braceIdx)).trim();

      if (!name) {
        err(lineNo, 0, 'Expected a class name after "class".');
        i++;
        continue;
      }
      if (!IDENT_RE.test(name)) {
        err(lineNo, 0, `Invalid class name "${name}".`);
      }

      const cls = ensureClass(name);

      if (braceIdx === -1) {
        // No brace: either `class Name` alone, or `class Name {` on next lines.
        i++;
        continue;
      }

      // Body may close on the same line: `class X { +a: int }`
      const afterBrace = rest.slice(braceIdx + 1);
      if (afterBrace.includes('}')) {
        const body = afterBrace.slice(0, afterBrace.indexOf('}')).trim();
        if (body) parseMember(body, cls, lineNo, 0, err);
        i++;
        continue;
      }

      // Multi-line body: consume until a line containing `}`.
      if (afterBrace.trim()) parseMember(afterBrace.trim(), cls, lineNo, 0, err);
      i++;
      let closed = false;
      while (i < rawLines.length) {
        const bodyLine = stripComment(rawLines[i]).trim();
        if (bodyLine.includes('}')) {
          const before = bodyLine.slice(0, bodyLine.indexOf('}')).trim();
          if (before) parseMember(before, cls, i, 0, err);
          closed = true;
          i++;
          break;
        }
        if (bodyLine) parseMember(bodyLine, cls, i, 0, err);
        i++;
      }
      if (!closed) err(lineNo, 0, `Class "${name}" is missing a closing "}".`);
      continue;
    }

    // ---- relationship ----
    const rel = parseRelationship(text, lineNo, err);
    if (rel) {
      ensureClass(rel.from);
      ensureClass(rel.to);
      relationships.push(rel);
    }
    i++;
  }

  return { classes, relationships, errors };
}

// Parse a single member line into either a field or a method on `cls`.
function parseMember(
  line: string,
  cls: ClassNode,
  lineNo: number,
  col: number,
  err: (line: number, col: number, message: string) => void
): void {
  let rest = line;
  let visibility: Visibility = 'public';
  const first = rest[0];
  if (first in VISIBILITY) {
    visibility = VISIBILITY[first];
    rest = rest.slice(1).trim();
  }

  const parenIdx = rest.indexOf('(');
  if (parenIdx !== -1) {
    // Method: name ( params ) : returnType
    const name = rest.slice(0, parenIdx).trim();
    const closeIdx = rest.indexOf(')', parenIdx);
    if (closeIdx === -1) {
      err(lineNo, col, `Method "${name}" is missing a closing ")".`);
      return;
    }
    const paramStr = rest.slice(parenIdx + 1, closeIdx).trim();
    const afterParen = rest.slice(closeIdx + 1).trim();
    let returnType: string | undefined;
    if (afterParen.startsWith(':')) {
      returnType = afterParen.slice(1).trim() || undefined;
    }
    const params: Param[] = paramStr
      ? paramStr.split(',').map((p) => {
          const [pname, ptype] = p.split(':').map((s) => s.trim());
          return { name: pname, type: ptype || undefined };
        })
      : [];
    const method: Method = { visibility, name, params, returnType };
    cls.methods.push(method);
    return;
  }

  // Field: name : type
  const colonIdx = rest.indexOf(':');
  const name = (colonIdx === -1 ? rest : rest.slice(0, colonIdx)).trim();
  const type = colonIdx === -1 ? undefined : rest.slice(colonIdx + 1).trim() || undefined;
  if (!name) {
    err(lineNo, col, 'Empty member definition.');
    return;
  }
  const member: Member = { visibility, name, type };
  cls.fields.push(member);
}

// Parse a relationship line. Returns null (and records an error) on failure.
function parseRelationship(
  text: string,
  lineNo: number,
  err: (line: number, col: number, message: string) => void
): Relationship | null {
  // Optional `: label` at the very end (outside quotes).
  let label: string | undefined;
  const labelMatch = /\s:\s*([^:]+)$/.exec(text);
  let working = text;
  if (labelMatch) {
    label = labelMatch[1].trim();
    working = text.slice(0, labelMatch.index).trim();
  }

  // Find the operator.
  let found: { op: string; kind: RelationshipKind; idx: number } | null = null;
  for (const { op, kind } of REL_OPERATORS) {
    const idx = working.indexOf(op);
    if (idx !== -1) {
      found = { op, kind, idx };
      break;
    }
  }
  if (!found) {
    err(lineNo, 0, `Unrecognized statement: "${text}".`);
    return null;
  }

  const leftRaw = working.slice(0, found.idx).trim();
  const rightRaw = working.slice(found.idx + found.op.length).trim();

  const left = extractEndpoint(leftRaw, 'left');
  const right = extractEndpoint(rightRaw, 'right');

  if (!left.name || !IDENT_RE.test(left.name)) {
    err(lineNo, 0, `Invalid or missing class on the left of "${found.op}".`);
    return null;
  }
  if (!right.name || !IDENT_RE.test(right.name)) {
    err(lineNo, 0, `Invalid or missing class on the right of "${found.op}".`);
    return null;
  }

  return {
    from: left.name,
    to: right.name,
    kind: found.kind,
    fromMult: left.mult,
    toMult: right.mult,
    label,
  };
}

// An endpoint is a class name with an optional "multiplicity" string.
// For the left side the multiplicity follows the name (`A "1"`), for the
// right side it precedes the name (`"*" B`).
function extractEndpoint(
  raw: string,
  side: 'left' | 'right'
): { name: string; mult?: string } {
  const multMatch = /"([^"]*)"/.exec(raw);
  let mult: string | undefined;
  let name = raw;
  if (multMatch) {
    mult = multMatch[1];
    name = raw.replace(multMatch[0], '').trim();
  }
  void side;
  return { name: name.trim(), mult };
}
