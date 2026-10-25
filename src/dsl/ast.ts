// Abstract syntax tree types for the UML class-diagram DSL.

export type Visibility = 'public' | 'private' | 'protected' | 'package';

export interface Member {
  visibility: Visibility;
  name: string;
  type?: string;
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
}

export interface ClassNode {
  name: string;
  fields: Member[];
  methods: Method[];
}

export type RelationshipKind =
  | 'inheritance'
  | 'realization'
  | 'association'
  | 'composition'
  | 'aggregation'
  | 'dependency';

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
  relationships: Relationship[];
  errors: ParseError[];
}

export const VISIBILITY_SYMBOL: Record<Visibility, string> = {
  public: '+',
  private: '-',
  protected: '#',
  package: '~',
};
