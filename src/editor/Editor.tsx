import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { useStore } from '../state/store';
import { umlHighlight } from './umlLanguage';

export function Editor() {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Grab the initial source once; subsequent edits flow through the store.
  const initial = useRef(useStore.getState().source);

  useEffect(() => {
    if (!parentRef.current) return;

    const state = EditorState.create({
      doc: initial.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        umlHighlight(),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          },
          '&.cm-focused': { outline: 'none' },
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            useStore.getState().setSource(u.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: parentRef.current });
    viewRef.current = view;

    // Keep the editor in sync when the source is replaced externally
    // (e.g. opening a file or loading a template).
    const unsub = useStore.subscribe((s) => {
      const current = view.state.doc.toString();
      if (s.source !== current) {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: s.source },
        });
      }
    });

    return () => {
      unsub();
      view.destroy();
    };
  }, []);

  return <div ref={parentRef} className="h-full w-full overflow-auto" />;
}
