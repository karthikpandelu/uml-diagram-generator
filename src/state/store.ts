import { create } from 'zustand';
import { parse } from '../dsl/parser';
import type { Diagram, Span } from '../dsl/ast';
import { DEFAULT_SOURCE } from '../examples/default';

interface AppState {
  source: string;
  diagram: Diagram;
  setSource: (source: string) => void;
  // Splice `newText` into the source over `span` and re-parse. Used by in-place
  // canvas editing of members and enum values.
  applyEdit: (span: Span, newText: string) => void;
  // Rename a class/enum: rewrite its declaration span AND every relationship
  // endpoint that references the old name, so arrows stay connected.
  renameNode: (nameSpan: Span, oldName: string, newName: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  source: DEFAULT_SOURCE,
  diagram: parse(DEFAULT_SOURCE),
  setSource: (source) => set({ source, diagram: parse(source) }),

  applyEdit: (span, newText) => {
    const { source } = get();
    const next = source.slice(0, span.start) + newText + source.slice(span.end);
    set({ source: next, diagram: parse(next) });
  },

  renameNode: (nameSpan, oldName, newName) => {
    const { source } = get();
    // Rewrite the declaration first (by span), then replace whole-word
    // occurrences of the old name elsewhere (relationship endpoints). Doing the
    // span edit first keeps offsets valid; the token replace runs on the result.
    const withDecl = source.slice(0, nameSpan.start) + newName + source.slice(nameSpan.end);
    // Only replace standalone identifier tokens, not substrings of longer names.
    const tokenRe = new RegExp(`\\b${escapeRegExp(oldName)}\\b`, 'g');
    const next = withDecl.replace(tokenRe, newName);
    set({ source: next, diagram: parse(next) });
  },
}));

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
