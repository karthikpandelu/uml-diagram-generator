import type { LaidOutClass } from '../layout/layout';
import {
  CLASS_STEREOTYPE_LABEL,
  COMPARTMENT_PADDING_Y,
  LINE_HEIGHT,
  PADDING_X,
} from '../layout/layout';
import { useStore } from '../state/store';
import { EditableText } from './EditableText';

interface Props {
  item: LaidOutClass;
}

// Renders a single UML class box with up to three compartments:
// name / fields / methods. Abstract classes and interfaces additionally
// show a «stereotype» line and render the name in italics. Name, field, and
// method text are editable in place (double-click) when the parser captured a
// source span for them.
export function ClassBox({ item }: Props) {
  const { x, y, width, height, headerHeight, nameSpan, fieldLines, methodLines, node } = item;
  const source = useStore((s) => s.source);
  const applyEdit = useStore((s) => s.applyEdit);
  const renameNode = useStore((s) => s.renameNode);

  const stereotype = node.stereotype;
  const stereotypeLabel = stereotype ? CLASS_STEREOTYPE_LABEL[stereotype] : undefined;

  const fieldsHeight =
    fieldLines.length > 0
      ? fieldLines.length * LINE_HEIGHT + COMPARTMENT_PADDING_Y * 2
      : COMPARTMENT_PADDING_Y * 2;

  const headerY = y + headerHeight;
  const fieldsY = headerY + fieldsHeight;

  // When a stereotype is present it sits at the top; the name goes just below.
  const nameY = stereotypeLabel ? y + headerHeight - LINE_HEIGHT / 2 - 2 : y + headerHeight / 2;

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

      {/* «stereotype» line (abstract / interface) */}
      {stereotypeLabel && (
        <text
          x={x + width / 2}
          y={y + 14}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fontStyle="italic"
          fill="#64748b"
        >
          {stereotypeLabel}
        </text>
      )}

      {/* header / class name (italic for abstract/interface, per UML convention) */}
      <EditableText
        x={x + width / 2}
        y={nameY}
        value={node.name}
        rawValue={node.name}
        onCommit={nameSpan ? (newRaw) => renameNode(nameSpan, node.name, newRaw) : undefined}
        editX={x + 4}
        editWidth={width - 8}
        anchor="middle"
        fontWeight={700}
        fontStyle={stereotype ? 'italic' : 'normal'}
        fontSize={14}
        fill="#0f172a"
      />

      {/* divider under header */}
      <line x1={x} y1={headerY} x2={x + width} y2={headerY} stroke="#334155" strokeWidth={1} />

      {/* fields */}
      {fieldLines.map((line, idx) => {
        const ty = headerY + COMPARTMENT_PADDING_Y + idx * LINE_HEIGHT + LINE_HEIGHT / 2;
        return (
          <EditableText
            key={`f-${idx}`}
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

      {/* divider between fields and methods */}
      <line x1={x} y1={fieldsY} x2={x + width} y2={fieldsY} stroke="#334155" strokeWidth={1} />

      {/* methods */}
      {methodLines.map((line, idx) => {
        const ty = fieldsY + COMPARTMENT_PADDING_Y + idx * LINE_HEIGHT + LINE_HEIGHT / 2;
        return (
          <EditableText
            key={`m-${idx}`}
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
