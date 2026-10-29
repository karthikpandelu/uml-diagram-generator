import { describe, expect, it } from 'vitest';
import {
  layout,
  memberLine,
  methodLine,
  STEREOTYPE_HEIGHT,
  type LaidOutClass,
  type LaidOutEnum,
} from '../layout';
import { parse } from '../../dsl/parser';
import type { Diagram } from '../../dsl/ast';

describe('layout: line formatting', () => {
  it('memberLine prefixes the visibility symbol and appends the type', () => {
    expect(memberLine({ visibility: 'public', name: 'id', type: 'int' })).toBe('+ id: int');
    expect(memberLine({ visibility: 'private', name: 'name', type: 'string' })).toBe(
      '- name: string'
    );
    expect(memberLine({ visibility: 'protected', name: 'at', type: 'date' })).toBe('# at: date');
    expect(memberLine({ visibility: 'package', name: 'x' })).toBe('~ x');
  });

  it('memberLine omits the type when absent', () => {
    expect(memberLine({ visibility: 'public', name: 'count' })).toBe('+ count');
  });

  it('methodLine joins params and appends the return type', () => {
    expect(
      methodLine({
        visibility: 'public',
        name: 'login',
        params: [
          { name: 'user', type: 'string' },
          { name: 'pw', type: 'string' },
        ],
        returnType: 'bool',
      })
    ).toBe('+ login(user: string, pw: string): bool');
  });

  it('methodLine handles no params and no return type', () => {
    expect(methodLine({ visibility: 'public', name: 'logout', params: [] })).toBe('+ logout()');
  });

  it('methodLine omits a param type when absent', () => {
    expect(methodLine({ visibility: 'private', name: 'f', params: [{ name: 'x' }] })).toBe(
      '- f(x)'
    );
  });
});

// Helper: find a laid-out node by name, narrowed to its kind.
function classNode(d: ReturnType<typeof layout>, name: string): LaidOutClass {
  const n = d.nodes.find((x) => x.kind === 'class' && x.node.name === name);
  if (!n || n.kind !== 'class') throw new Error(`class ${name} not found`);
  return n;
}
function enumNode(d: ReturnType<typeof layout>, name: string): LaidOutEnum {
  const n = d.nodes.find((x) => x.kind === 'enum' && x.node.name === name);
  if (!n || n.kind !== 'enum') throw new Error(`enum ${name} not found`);
  return n;
}

describe('layout: sizing', () => {
  it('a wider member produces a wider box', () => {
    const narrow = layout(parse('class A {\n  +x: int\n}'));
    const wide = layout(parse('class A {\n  +aVeryLongFieldNameIndeed: SomeLongTypeName\n}'));
    expect(classNode(wide, 'A').width).toBeGreaterThan(classNode(narrow, 'A').width);
  });

  it('a stereotype adds STEREOTYPE_HEIGHT to the header', () => {
    const plain = layout(parse('class A'));
    const abstract = layout(parse('abstract class A'));
    expect(classNode(abstract, 'A').headerHeight).toBe(
      classNode(plain, 'A').headerHeight + STEREOTYPE_HEIGHT
    );
  });
});

describe('layout: nodes and edges', () => {
  it('emits a node of the right kind for every class and enum', () => {
    const d: Diagram = parse(`class User
enum Status { A, B }
User --> Status`);
    const laid = layout(d);
    expect(laid.nodes).toHaveLength(2);
    expect(classNode(laid, 'User').kind).toBe('class');
    const status = enumNode(laid, 'Status');
    expect(status.kind).toBe('enum');
    expect(status.values).toEqual(['A', 'B']);
  });

  it('emits an edge only when both endpoints are known', () => {
    const laid = layout(parse('class A\nclass B\nA --> B'));
    expect(laid.edges).toHaveLength(1);
    expect(laid.edges[0].rel).toMatchObject({ from: 'A', to: 'B', kind: 'association' });
  });

  it('returns positive overall dimensions', () => {
    const laid = layout(parse('class A\nclass B\nA --|> B'));
    expect(laid.width).toBeGreaterThan(0);
    expect(laid.height).toBeGreaterThan(0);
  });

  it('positions nodes with top-left coordinates (not centers)', () => {
    const laid = layout(parse('class A'));
    const a = classNode(laid, 'A');
    expect(Number.isFinite(a.x)).toBe(true);
    expect(Number.isFinite(a.y)).toBe(true);
    expect(a.width).toBeGreaterThan(0);
    expect(a.height).toBeGreaterThan(0);
  });
});
