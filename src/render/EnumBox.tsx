import type { LaidOutEnum } from '../layout/layout';
import { COMPARTMENT_PADDING_Y, ENUM_STEREOTYPE, LINE_HEIGHT, PADDING_X } from '../layout/layout';

interface Props {
  item: LaidOutEnum;
}

// Renders a UML enumeration box: a «enumeration» stereotype and the class
// name in the header, then a single compartment listing the values.
export function EnumBox({ item }: Props) {
  const { x, y, width, height, headerHeight, values, node } = item;

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
      <text
        x={x + width / 2}
        y={y + headerHeight - LINE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight={700}
        fontSize={14}
        fill="#0f172a"
      >
        {node.name}
      </text>

      {/* divider under header */}
      <line x1={x} y1={headerY} x2={x + width} y2={headerY} stroke="#334155" strokeWidth={1} />

      {/* values */}
      {values.map((value, idx) => (
        <text
          key={`v-${idx}`}
          x={x + PADDING_X}
          y={headerY + COMPARTMENT_PADDING_Y + idx * LINE_HEIGHT + LINE_HEIGHT / 2}
          dominantBaseline="central"
          fontSize={13}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#1e293b"
        >
          {value}
        </text>
      ))}
    </g>
  );
}
