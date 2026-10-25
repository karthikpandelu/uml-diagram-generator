import type { LaidOutEdge, Point } from '../layout/layout';

interface Props {
  edge: LaidOutEdge;
}

const DASHED = new Set(['realization', 'dependency']);

// Compute the unit vector pointing *into* a point from the previous point.
function direction(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

// Build a rotated marker polygon given a tip point and the incoming direction.
function markerPoints(tip: Point, dir: Point, back: number, half: number): string {
  // perpendicular
  const px = -dir.y;
  const py = dir.x;
  const baseX = tip.x - dir.x * back;
  const baseY = tip.y - dir.y * back;
  const left = { x: baseX + px * half, y: baseY + py * half };
  const right = { x: baseX - px * half, y: baseY - py * half };
  return `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

function diamondPoints(tip: Point, dir: Point, len: number, half: number): string {
  const px = -dir.y;
  const py = dir.x;
  const midX = tip.x - dir.x * (len / 2);
  const midY = tip.y - dir.y * (len / 2);
  const backX = tip.x - dir.x * len;
  const backY = tip.y - dir.y * len;
  const left = { x: midX + px * half, y: midY + py * half };
  const right = { x: midX - px * half, y: midY - py * half };
  return `${tip.x},${tip.y} ${left.x},${left.y} ${backX},${backY} ${right.x},${right.y}`;
}

export function Edge({ edge }: Props) {
  const { rel, points } = edge;
  if (points.length < 2) return null;

  const kind = rel.kind;
  const stroke = '#475569';
  const dash = DASHED.has(kind) ? '6 4' : undefined;

  const poly = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Endpoint geometry.
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const dirTo = direction(prev, last); // pointing into `to`

  const first = points[0];
  const second = points[1];
  const dirFrom = direction(second, first); // pointing into `from`

  const decorations: React.ReactNode[] = [];

  // Arrow/triangle at the `to` end.
  if (kind === 'inheritance' || kind === 'realization') {
    // hollow triangle
    decorations.push(
      <polygon
        key="head"
        points={markerPoints(last, dirTo, 14, 8)}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  } else if (kind === 'association') {
    // open arrowhead (two strokes)
    const p = markerPoints(last, dirTo, 12, 6).split(' ');
    decorations.push(
      <polyline key="head" points={`${p[1]} ${p[0]} ${p[2]}`} fill="none" stroke={stroke} strokeWidth={1.5} />
    );
  } else if (kind === 'dependency') {
    const p = markerPoints(last, dirTo, 12, 6).split(' ');
    decorations.push(
      <polyline key="head" points={`${p[1]} ${p[0]} ${p[2]}`} fill="none" stroke={stroke} strokeWidth={1.5} />
    );
  }

  // Diamond at the `from` end for composition/aggregation.
  if (kind === 'composition') {
    decorations.push(
      <polygon key="diamond" points={diamondPoints(first, dirFrom, 18, 7)} fill={stroke} stroke={stroke} strokeWidth={1.5} />
    );
  } else if (kind === 'aggregation') {
    decorations.push(
      <polygon key="diamond" points={diamondPoints(first, dirFrom, 18, 7)} fill="#ffffff" stroke={stroke} strokeWidth={1.5} />
    );
  }

  // Label + multiplicity placement.
  const mid = points[Math.floor(points.length / 2)];

  return (
    <g>
      <polyline points={poly} fill="none" stroke={stroke} strokeWidth={1.5} strokeDasharray={dash} />
      {decorations}
      {rel.label && (
        <text
          x={mid.x}
          y={mid.y - 6}
          textAnchor="middle"
          fontSize={12}
          fill="#334155"
          stroke="#ffffff"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {rel.label}
        </text>
      )}
      {rel.fromMult && (
        <text x={first.x + 8} y={first.y + 14} fontSize={11} fill="#64748b">
          {rel.fromMult}
        </text>
      )}
      {rel.toMult && (
        <text x={last.x + 8} y={last.y - 8} fontSize={11} fill="#64748b">
          {rel.toMult}
        </text>
      )}
    </g>
  );
}
