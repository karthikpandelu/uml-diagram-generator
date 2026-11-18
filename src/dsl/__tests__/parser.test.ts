import { describe, expect, it } from 'vitest';
import { parse } from '../parser';

describe('parser: classes', () => {
  it('parses a class with fields and methods', () => {
    const d = parse(`class User {
      +id: int
      -name: string
      #createdAt: date
      +login(password: string): bool
      +logout()
    }`);
    expect(d.errors).toEqual([]);
    expect(d.classes).toHaveLength(1);
    const u = d.classes[0];
    expect(u.name).toBe('User');
    expect(u.fields).toMatchObject([
      { visibility: 'public', name: 'id', type: 'int' },
      { visibility: 'private', name: 'name', type: 'string' },
      { visibility: 'protected', name: 'createdAt', type: 'date' },
    ]);
    expect(u.methods).toHaveLength(2);
    expect(u.methods[0]).toMatchObject({
      visibility: 'public',
      name: 'login',
      params: [{ name: 'password', type: 'string' }],
      returnType: 'bool',
    });
    expect(u.methods[1]).toMatchObject({
      visibility: 'public',
      name: 'logout',
      params: [],
      returnType: undefined,
    });
  });

  it('parses an empty class without braces', () => {
    const d = parse('class Admin');
    expect(d.errors).toEqual([]);
    expect(d.classes[0]).toMatchObject({ name: 'Admin', fields: [], methods: [] });
  });

  it('parses a single-line class body', () => {
    const d = parse('class X { +a: int }');
    expect(d.errors).toEqual([]);
    expect(d.classes[0].fields).toMatchObject([{ visibility: 'public', name: 'a', type: 'int' }]);
  });

  it('defaults visibility to public', () => {
    const d = parse(`class X {
      count: int
    }`);
    expect(d.classes[0].fields[0].visibility).toBe('public');
  });

  it('parses a method with multiple params', () => {
    const d = parse(`class X {
      +move(dx: int, dy: int): void
    }`);
    expect(d.classes[0].methods[0].params).toEqual([
      { name: 'dx', type: 'int' },
      { name: 'dy', type: 'int' },
    ]);
  });
});

describe('parser: relationships', () => {
  const kinds = [
    { src: 'A --|> B', kind: 'inheritance' },
    { src: 'A ..|> B', kind: 'realization' },
    { src: 'A --> B', kind: 'association' },
    { src: 'A *-- B', kind: 'composition' },
    { src: 'A o-- B', kind: 'aggregation' },
    { src: 'A ..> B', kind: 'dependency' },
  ] as const;

  for (const { src, kind } of kinds) {
    it(`parses ${kind}`, () => {
      const d = parse(src);
      expect(d.errors).toEqual([]);
      expect(d.relationships[0]).toMatchObject({ from: 'A', to: 'B', kind });
    });
  }

  it('creates stub classes for referenced-but-undeclared classes', () => {
    const d = parse('A --> B');
    expect(d.classes.map((c) => c.name).sort()).toEqual(['A', 'B']);
  });

  it('parses multiplicity and label', () => {
    const d = parse('User "1" --> "*" Order : places');
    expect(d.errors).toEqual([]);
    expect(d.relationships[0]).toEqual({
      from: 'User',
      to: 'Order',
      kind: 'association',
      fromMult: '1',
      toMult: '*',
      label: 'places',
    });
  });

  it('prefers longest operator match (--|> over -->)', () => {
    const d = parse('A --|> B');
    expect(d.relationships[0].kind).toBe('inheritance');
  });
});

describe('parser: comments and errors', () => {
  it('ignores line comments', () => {
    const d = parse(`// a comment
      class X   // trailing comment
    `);
    expect(d.errors).toEqual([]);
    expect(d.classes[0].name).toBe('X');
  });

  it('reports a missing closing brace', () => {
    const d = parse(`class X {
      +a: int`);
    expect(d.errors.some((e) => /closing "}"/.test(e.message))).toBe(true);
  });

  it('reports an unrecognized statement', () => {
    const d = parse('this is nonsense');
    expect(d.errors.some((e) => /Unrecognized/.test(e.message))).toBe(true);
  });

  it('keeps valid content despite an error elsewhere', () => {
    const d = parse(`class Good
      garbage line here`);
    expect(d.classes[0].name).toBe('Good');
    expect(d.errors.length).toBeGreaterThan(0);
  });
});

describe('parser: enums', () => {
  it('parses an enum with newline-separated values', () => {
    const d = parse(`enum Status {
      ACTIVE
      INACTIVE
      PENDING
    }`);
    expect(d.errors).toEqual([]);
    expect(d.enums).toHaveLength(1);
    expect(d.enums[0].name).toBe('Status');
    expect(d.enums[0].values.map((v) => v.name)).toEqual(['ACTIVE', 'INACTIVE', 'PENDING']);
    // An enum is not also a class.
    expect(d.classes).toHaveLength(0);
  });

  it('parses a single-line enum body', () => {
    const d = parse('enum Color { RED, GREEN, BLUE }');
    expect(d.errors).toEqual([]);
    expect(d.enums[0].values.map((v) => v.name)).toEqual(['RED', 'GREEN', 'BLUE']);
  });

  it('parses an empty enum without braces', () => {
    const d = parse('enum Empty');
    expect(d.errors).toEqual([]);
    expect(d.enums[0].name).toBe('Empty');
    expect(d.enums[0].values).toEqual([]);
  });

  it('supports comma-separated values across lines', () => {
    const d = parse(`enum Mix {
      A, B
      C
    }`);
    expect(d.errors).toEqual([]);
    expect(d.enums[0].values.map((v) => v.name)).toEqual(['A', 'B', 'C']);
  });

  it('lets an enum be a relationship endpoint without creating a stub class', () => {
    const d = parse(`enum Status { ACTIVE }
      class User
      User --> Status`);
    expect(d.errors).toEqual([]);
    expect(d.enums.map((e) => e.name)).toEqual(['Status']);
    expect(d.classes.map((c) => c.name)).toEqual(['User']);
    expect(d.relationships[0]).toMatchObject({ from: 'User', to: 'Status' });
  });

  it('does not leave a stub class when an enum is referenced before declaration', () => {
    const d = parse(`User --> Status
      enum Status { ACTIVE }`);
    expect(d.classes.map((c) => c.name)).toEqual(['User']);
    expect(d.enums.map((e) => e.name)).toEqual(['Status']);
  });

  it('reports a missing closing brace on an enum', () => {
    const d = parse(`enum Status {
      ACTIVE`);
    expect(d.errors.some((e) => /closing "}"/.test(e.message))).toBe(true);
  });

  it('reports an invalid enum value', () => {
    const d = parse(`enum Bad {
      ok
      not valid
    }`);
    expect(d.errors.some((e) => /Invalid enum value/.test(e.message))).toBe(true);
  });
});

describe('parser: abstract classes and interfaces', () => {
  it('parses an abstract class with the abstract stereotype', () => {
    const d = parse(`abstract class Shape {
      +area(): float
      +draw()
    }`);
    expect(d.errors).toEqual([]);
    expect(d.classes).toHaveLength(1);
    expect(d.classes[0].name).toBe('Shape');
    expect(d.classes[0].stereotype).toBe('abstract');
    expect(d.classes[0].methods).toHaveLength(2);
  });

  it('parses an interface with the interface stereotype', () => {
    const d = parse(`interface Drawable {
      +render(): void
    }`);
    expect(d.errors).toEqual([]);
    expect(d.classes[0].name).toBe('Drawable');
    expect(d.classes[0].stereotype).toBe('interface');
    expect(d.classes[0].methods[0].name).toBe('render');
  });

  it('leaves a plain class without a stereotype', () => {
    const d = parse('class Plain { +x: int }');
    expect(d.errors).toEqual([]);
    expect(d.classes[0].stereotype).toBeUndefined();
  });

  it('parses an abstract class with no body', () => {
    const d = parse('abstract class Base');
    expect(d.errors).toEqual([]);
    expect(d.classes[0]).toMatchObject({ name: 'Base', stereotype: 'abstract' });
  });

  it('parses an empty interface with no braces', () => {
    const d = parse('interface Marker');
    expect(d.errors).toEqual([]);
    expect(d.classes[0]).toMatchObject({ name: 'Marker', stereotype: 'interface' });
  });

  it('supports realization/inheritance relationships with these types', () => {
    const d = parse(`abstract class Shape
      interface Drawable
      class Circle
      Circle --|> Shape
      Circle ..|> Drawable`);
    expect(d.errors).toEqual([]);
    const byName = Object.fromEntries(d.classes.map((c) => [c.name, c]));
    expect(byName.Shape.stereotype).toBe('abstract');
    expect(byName.Drawable.stereotype).toBe('interface');
    expect(byName.Circle.stereotype).toBeUndefined();
    expect(d.relationships).toHaveLength(2);
  });

  it('does not treat a class named with an "abstract"-like prefix as abstract', () => {
    // "abstractThing" is a single identifier, not the `abstract class` keyword.
    const d = parse('class AbstractThing { +x: int }');
    expect(d.classes[0].name).toBe('AbstractThing');
    expect(d.classes[0].stereotype).toBeUndefined();
  });
});

describe('parser: source spans (for in-place editing)', () => {
  // The defining property: slicing the source by a captured span yields exactly
  // the token/line that produced the rendered element.
  const sliceOf = (src: string, span: { start: number; end: number }) =>
    src.slice(span.start, span.end);

  it('captures the class name span', () => {
    const src = 'class User {\n  -name: string\n}';
    const d = parse(src);
    const span = d.classes[0].nameSpan!;
    expect(span).toBeDefined();
    expect(sliceOf(src, span)).toBe('User');
  });

  it('captures name spans for abstract classes and interfaces (after the keyword)', () => {
    const abs = 'abstract class Account';
    expect(sliceOf(abs, parse(abs).classes[0].nameSpan!)).toBe('Account');
    const iface = 'interface Authenticatable';
    expect(sliceOf(iface, parse(iface).classes[0].nameSpan!)).toBe('Authenticatable');
  });

  it('captures field and method line spans covering the whole member', () => {
    const src = 'class User {\n  -name: string\n  +login(pw: string): bool\n}';
    const d = parse(src);
    expect(sliceOf(src, d.classes[0].fields[0].span!)).toBe('-name: string');
    expect(sliceOf(src, d.classes[0].methods[0].span!)).toBe('+login(pw: string): bool');
  });

  it('captures a span for a single-line class body member', () => {
    const src = 'class X { +a: int }';
    const d = parse(src);
    expect(sliceOf(src, d.classes[0].fields[0].span!)).toBe('+a: int');
  });

  it('captures the enum name span', () => {
    const src = 'enum Status {\n  ACTIVE\n}';
    const d = parse(src);
    expect(sliceOf(src, d.enums[0].nameSpan!)).toBe('Status');
  });

  it('captures a span for each enum value (newline- and comma-separated)', () => {
    const src = 'enum Mix {\n  A, B\n  C\n}';
    const d = parse(src);
    const vals = d.enums[0].values;
    expect(vals.map((v) => v.name)).toEqual(['A', 'B', 'C']);
    for (const v of vals) {
      expect(v.span).toBeDefined();
      expect(sliceOf(src, v.span!)).toBe(v.name);
    }
  });

  it('captures value spans for a single-line enum body', () => {
    const src = 'enum Color { RED, GREEN, BLUE }';
    const d = parse(src);
    for (const v of d.enums[0].values) {
      expect(sliceOf(src, v.span!)).toBe(v.name);
    }
  });

  it('distinguishes repeated identical values by their own spans', () => {
    const src = 'enum Dup {\n  X\n  X\n}';
    const d = parse(src);
    const [a, b] = d.enums[0].values;
    expect(sliceOf(src, a.span!)).toBe('X');
    expect(sliceOf(src, b.span!)).toBe('X');
    // Two distinct occurrences, not the same offset.
    expect(a.span!.start).not.toBe(b.span!.start);
  });
});
