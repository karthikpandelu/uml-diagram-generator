import type { LaidOutClass } from '../layout/layout';
import { COMPARTMENT_PADDING_Y, LINE_HEIGHT, PADDING_X } from '../layout/layout';

interface Props {
  item: LaidOutClass;
}

// Renders a single UML class box with up to three compartments:
// name / fields / methods.
export function ClassBox({ item }: Props) {
  const { x, y, width, height, headerHeight, fieldLines, methodLines, node } = item;

  const fieldsHeight =
    fieldLines.length > 0
      ? fieldLines.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;

  const headerY = y + headerHeight;
  const fieldsY = headerY + fieldsHeight;

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

      {/* header / class name */}
      <text
        x={x + width / 2}
        y={y + headerHeight / 2}
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

      {/* fields */}
      {fieldLines.map((line, idx) => (
        <text
          key={`f-${idx}`}
          x={x + PADDING_X}
          y={headerY + COMPARTMENT_PADDING_Y + idx * LINE_HEIGHT + LINE_HEIGHT / 2}
          dominantBaseline="central"
          fontSize={13}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#1e293b"
        >
          {line}
        </text>
      ))}

      {/* divider between fields and methods */}
      <line x1={x} y1={fieldsY} x2={x + width} y2={fieldsY} stroke="#334155" strokeWidth={1} />

      {/* methods */}
      {methodLines.map((line, idx) => (
        <text
          key={`m-${idx}`}
          x={x + PADDING_X}
          y={fieldsY + COMPARTMENT_PADDING_Y + idx * LINE_HEIGHT + LINE_HEIGHT / 2}
          dominantBaseline="central"
          fontSize={13}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#1e293b"
        >
          {line}
        </text>
      ))}
    </g>
  );
}
