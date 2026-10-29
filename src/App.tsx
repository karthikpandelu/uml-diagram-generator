import { useEffect, useState, useRef } from 'react';
import { useStore } from './state/store';
import { Editor } from './editor/Editor';
import { DiagramCanvas } from './render/DiagramCanvas';
import { openTextFile, saveTextFile } from './io/fileio';
import { exportPng, exportSvg } from './io/export';
import { SplitPane } from './ui/SplitPane';
import { HelpDialog } from './ui/HelpDialog';
import { ErrorBoundary } from './ui/ErrorBoundary';

function ToolbarButton({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100"
    >
      {children}
    </button>
  );
}

export default function App() {
  const source = useStore((s) => s.source);
  const setSource = useStore((s) => s.setSource);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpen = async () => {
    const text = await openTextFile();
    if (text !== null) setSource(text);
  };

  const handleSaveText = () => saveTextFile(source);
  const handleSavePng = () => {
    setImageMenuOpen(false);
    exportPng();
  };
  const handleSaveSvg = () => {
    setImageMenuOpen(false);
    exportSvg();
  };

  const handleClear = () => {
    if (source === '' || window.confirm('Clear all text? This cannot be undone.')) {
      setSource('');
    }
  };

  // Keyboard shortcuts: Cmd/Ctrl+S = save text, Cmd/Ctrl+Shift+S = save PNG.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) exportPng();
        else saveTextFile(useStore.getState().source);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the image menu on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setImageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <h1 className="mr-2 text-sm font-semibold text-slate-800">UML Class Diagram</h1>
        <ToolbarButton onClick={handleOpen} title="Open a .txt file">
          Open
        </ToolbarButton>
        <ToolbarButton onClick={handleSaveText} title="Save source as .txt (Cmd/Ctrl+S)">
          Save Text
        </ToolbarButton>
        <div className="relative" ref={menuRef}>
          <ToolbarButton
            onClick={() => setImageMenuOpen((o) => !o)}
            title="Export the diagram as an image (Cmd/Ctrl+Shift+S for PNG)"
          >
            Save Image ▾
          </ToolbarButton>
          {imageMenuOpen && (
            <div className="absolute left-0 z-20 mt-1 w-32 rounded border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleSavePng}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100"
              >
                PNG
              </button>
              <button
                onClick={handleSaveSvg}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100"
              >
                SVG (vector)
              </button>
            </div>
          )}
        </div>

        <ToolbarButton onClick={handleClear} title="Clear all text">
          Clear
        </ToolbarButton>

        {/* Help button pushed to the right. */}
        <div className="ml-auto">
          <ToolbarButton onClick={() => setHelpOpen(true)} title="How to write the diagram text">
            ? Help
          </ToolbarButton>
        </div>
      </header>

      {/* Split pane (draggable divider) */}
      <SplitPane
        left={<Editor />}
        right={
          <ErrorBoundary>
            <DiagramCanvas />
          </ErrorBoundary>
        }
        initial={0.4}
      />

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
