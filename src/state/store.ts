import { create } from 'zustand';
import { parse } from '../dsl/parser';
import type { Diagram } from '../dsl/ast';
import { DEFAULT_SOURCE } from '../examples/default';

interface AppState {
  source: string;
  diagram: Diagram;
  setSource: (source: string) => void;
}

export const useStore = create<AppState>((set) => ({
  source: DEFAULT_SOURCE,
  diagram: parse(DEFAULT_SOURCE),
  setSource: (source) => set({ source, diagram: parse(source) }),
}));
