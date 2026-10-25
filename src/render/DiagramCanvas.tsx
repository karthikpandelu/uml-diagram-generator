import { useMemo, useRef, useState, useCallback } from 'react';
import { useStore } from '../state/store';
import { layout } from '../layout/layout';
import { ClassBox } from './ClassBox';
import { Edge } from './Edge';

export const DIAGRAM_SVG_ID = 'uml-diagram-svg';

export function DiagramCanvas() {
  const diagram = useStore((s) => s.diagram);
  const laid = useMemo(() => layout(diagram), [diagram]);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef<{ x: number; y: number } | null>(null);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setView((v) => ({ ...v, scale: Math.min(4, Math.max(0.2, v.scale * factor)) }));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = { x: e.clientX - view.x, y: e.clientY - view.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setView((v) => ({ ...v, x: e.clientX - dragging.current!.x, y: e.clientY - dragging.current!.y }));
  };
  const onMouseUp = () => {
    dragging.current = null;
  };

  const fit = () => setView({ x: 0, y: 0, scale: 1 });

  const padding = 40;
  const vbWidth = laid.width + padding * 2;
  const vbHeight = laid.height + padding * 2;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-50">
      {/* zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex gap-1">
        <button
          className="rounded bg-white px-2 py-1 text-sm shadow hover:bg-slate-100"
          onClick={() => setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.2) }))}
        >
          +
        </button>
        <button
          className="rounded bg-white px-2 py-1 text-sm shadow hover:bg-slate-100"
          onClick={() => setView((v) => ({ ...v, scale: Math.max(0.2, v.scale / 1.2) }))}
        >
          −
        </button>
        <button
          className="rounded bg-white px-2 py-1 text-sm shadow hover:bg-slate-100"
          onClick={fit}
        >
          Reset
        </button>
      </div>

      <svg
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
          {/* Inner SVG is the exportable artifact (fixed to content bounds). */}
          <svg
            id={DIAGRAM_SVG_ID}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`${-padding} ${-padding} ${vbWidth} ${vbHeight}`}
            width={vbWidth}
            height={vbHeight}
          >
            <rect x={-padding} y={-padding} width={vbWidth} height={vbHeight} fill="#ffffff" />
            {laid.edges.map((edge, i) => (
              <Edge key={`e-${i}`} edge={edge} />
            ))}
            {laid.classes.map((item) => (
              <ClassBox key={item.node.name} item={item} />
            ))}
          </svg>
        </g>
      </svg>

      {diagram.errors.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 max-h-40 overflow-auto border-t border-red-200 bg-red-50 p-2 text-xs text-red-800">
          <div className="mb-1 font-semibold">
            {diagram.errors.length} issue{diagram.errors.length > 1 ? 's' : ''}
          </div>
          <ul className="space-y-0.5">
            {diagram.errors.map((err, i) => (
              <li key={i}>
                <span className="font-mono text-red-600">
                  line {err.line}:{err.col}
                </span>{' '}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
