import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  /** Initial width of the left pane as a fraction of the total (0–1). */
  initial?: number;
  minLeft?: number; // px
  minRight?: number; // px
}

// A horizontal split with a draggable divider between the two panes.
export function SplitPane({ left, right, initial = 0.4, minLeft = 280, minRight = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number | null>(null); // px; null until measured
  const dragging = useRef(false);

  // Set the initial pixel width once the container is measured.
  useEffect(() => {
    if (containerRef.current && leftWidth === null) {
      setLeftWidth(containerRef.current.clientWidth * initial);
    }
  }, [initial, leftWidth]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let next = e.clientX - rect.left;
      next = Math.max(minLeft, Math.min(rect.width - minRight, next));
      setLeftWidth(next);
    },
    [minLeft, minRight]
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1">
      <div
        className="min-w-0 border-r border-slate-200"
        style={leftWidth === null ? { width: `${initial * 100}%` } : { width: leftWidth, flex: '0 0 auto' }}
      >
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="group relative w-1 flex-none cursor-col-resize bg-slate-200 hover:bg-indigo-400"
        title="Drag to resize"
      >
        {/* wider invisible hit area for easier grabbing */}
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>
      <div className="min-w-0 flex-1">{right}</div>
    </div>
  );
}
