import { useEffect, useRef, useState } from 'react';

interface Props {
  // Text anchor position in SVG user space.
  x: number;
  y: number;
  // Displayed (pretty) string, e.g. "- name: string".
  value: string;
  // Exact source slice the user edits, e.g. "-name: string". Defaults to value.
  rawValue?: string;
  // Called with the new raw text on commit. If absent, the text is not editable.
  onCommit?: (newRaw: string) => void;
  // Overlay input geometry (SVG user space). Falls back to sensible defaults
  // derived from `x`/`y` when omitted.
  editX?: number;
  editY?: number;
  editWidth?: number;
  // SVG text styling (mirrors the <text> this replaces so looks are unchanged).
  anchor?: 'start' | 'middle';
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  fill?: string;
}

const EDIT_HEIGHT = 22;

// An SVG <text> that becomes an inline <input> (hosted in a <foreignObject>) on
// double-click, letting the user edit the underlying DSL in place. Enter / blur
// commit; Escape cancels. When `onCommit` is absent the text is plain and
// non-editable (e.g. a node with no known source span).
export function EditableText({
  x,
  y,
  value,
  rawValue,
  onCommit,
  editX,
  editY,
  editWidth,
  anchor = 'start',
  fontSize = 13,
  fontWeight,
  fontStyle,
  fontFamily,
  fill = '#1e293b',
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const editable = typeof onCommit === 'function';

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const begin = () => {
    if (!editable) return;
    setDraft(rawValue ?? value);
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;
    setEditing(false);
    const trimmed = draft.trim();
    const original = (rawValue ?? value).trim();
    if (trimmed && trimmed !== original) onCommit!(trimmed);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    const w = editWidth ?? 160;
    const fx = editX ?? (anchor === 'middle' ? x - w / 2 : x);
    const fy = (editY ?? y) - EDIT_HEIGHT / 2;
    return (
      <foreignObject x={fx} y={fy} width={w} height={EDIT_HEIGHT}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
            // Don't let the canvas see these keys.
            e.stopPropagation();
          }}
          // Prevent the double-click / drag handlers on the canvas from firing.
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            padding: '0 4px',
            border: '1px solid #3b82f6',
            borderRadius: 2,
            outline: 'none',
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            background: '#fff',
            color: '#0f172a',
          }}
        />
      </foreignObject>
    );
  }

  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight={fontWeight}
      fontStyle={fontStyle}
      fontFamily={fontFamily}
      fill={fill}
      onDoubleClick={begin}
      style={editable ? { cursor: 'text' } : undefined}
    >
      {value}
    </text>
  );
}
