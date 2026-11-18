import type { LaidOutEnum } from '../layout/layout';
import { COMPARTMENT_PADDING_Y, ENUM_STEREOTYPE, LINE_HEIGHT, PADDING_X } from '../layout/layout';
import { useStore } from '../state/store';
import { EditableText } from './EditableText';

interface Props {
  item: LaidOutEnum;
}

// Renders a UML enumeration box: a «enumeration» stereotype and the class
// name in the header, then a single compartment listing the values. Name and
// values are editable in place (double-click) when a source span is known.
export function EnumBox({ item }: Props) {
  const { x, y, width, height, headerHeight, nameSpan, values, node } = item;
  const source = useStore((s) => s.source);
  const applyEdit = useStore((s) => s.applyEdit);
  const renameNode = useStore((s) => s.renameNode);

  const headerY = y + headerHeight;

  return (
    <g>
      {/* outer box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#ffffff"
        stroke="#334155"
        strokeWidth={1.5}
        rx={2}
      />

      {/* «enumeration» stereotype */}
      <text
        x={x + width / 2}
        y={y + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontStyle="italic"
        fill="#64748b"
      >
        {ENUM_STEREOTYPE}
      </text>

      {/* enum name */}
      <EditableText
        x={x + width / 2}
        y={y + headerHeight - LINE_HEIGHT / 2}
        value={node.name}
        rawValue={node.name}
        onCommit={nameSpan ? (newRaw) => renameNode(nameSpan, node.name, newRaw) : undefined}
        editX={x + 4}
        editWidth={width - 8}
        anchor="middle"
        fontWeight={700}
        fontSize={14}
        fill="#0f172a"
      />

      {/* divider under header */}
      <line x1={x} y1={headerY} x2={x + width} y2={headerY} stroke="#334155" strokeWidth={1} />

      {/* values */}
      {values.map((line, idx) => {
        const ty = headerY + COMPARTMENT_PADDING_Y + idx * LINE_HEIGHT + LINE_HEIGHT / 2;
        return (
          <EditableText
            key={`v-${idx}`}
            x={x + PADDING_X}
            y={ty}
            value={line.text}
            rawValue={line.span ? source.slice(line.span.start, line.span.end) : line.text}
            onCommit={line.span ? (newRaw) => applyEdit(line.span!, newRaw) : undefined}
            editX={x + 4}
            editY={ty}
            editWidth={width - 8}
            fontSize={13}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#1e293b"
          />
        );
      })}
    </g>
  );
}
