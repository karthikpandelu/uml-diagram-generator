// Abstract syntax tree types for the UML class-diagram DSL.

// Absolute character offsets into the source string, `[start, end)`. Carried on
// editable nodes so a rendered element can be mapped back to the exact text that
// produced it (used by in-place canvas editing). Optional everywhere: nodes the
// parser can't localize (e.g. relationship stub classes) simply omit it and
// render as non-editable.
export interface Span {
  start: number;
  end: number;
}

export type Visibility = 'public' | 'private' | 'protected' | 'package';

export interface Member {
  visibility: Visibility;
  name: string;
  type?: string;
  span?: Span; // the whole member-line content in the source
}

export interface Param {
  name: string;
  type?: string;
}

export interface Method {
  visibility: Visibility;
  name: string;
  params: Param[];
  returnType?: string;
  span?: Span; // the whole member-line content in the source
}

export type ClassStereotype = 'abstract' | 'interface';

export interface ClassNode {
  name: string;
  fields: Member[];
  methods: Method[];
  stereotype?: ClassStereotype;
  nameSpan?: Span; // the class name token in the source
}

export interface EnumValue {
  name: string;
  span?: Span;
}

export interface EnumNode {
  name: string;
  values: EnumValue[];
  nameSpan?: Span; // the enum name token in the source
}

export type RelationshipKind =
  'inheritance' | 'realization' | 'association' | 'composition' | 'aggregation' | 'dependency';

export interface Relationship {
  from: string;
  to: string;
  kind: RelationshipKind;
  fromMult?: string;
  toMult?: string;
  label?: string;
}

export interface ParseError {
  line: number; // 1-based
  col: number; // 1-based
  message: string;
}

export interface Diagram {
  classes: ClassNode[];
  enums: EnumNode[];
  relationships: Relationship[];
  errors: ParseError[];
}

export const VISIBILITY_SYMBOL: Record<Visibility, string> = {
  public: '+',
  private: '-',
  protected: '#',
  package: '~',
};
