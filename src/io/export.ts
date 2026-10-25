// Export the rendered diagram as PNG (raster) or SVG (vector).

import { toPng } from 'html-to-image';
import { DIAGRAM_SVG_ID } from '../render/DiagramCanvas';
import { downloadBlob } from './fileio';

function getDiagramSvg(): SVGSVGElement {
  const el = document.getElementById(DIAGRAM_SVG_ID);
  if (!el) throw new Error('Diagram SVG not found.');
  return el as unknown as SVGSVGElement;
}

export async function exportPng(filename = 'diagram.png') {
  const svg = getDiagramSvg();
  const width = Number(svg.getAttribute('width')) || svg.clientWidth;
  const height = Number(svg.getAttribute('height')) || svg.clientHeight;

  const dataUrl = await toPng(svg as unknown as HTMLElement, {
    width,
    height,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    style: { transform: 'none' },
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

export function exportSvg(filename = 'diagram.svg') {
  const svg = getDiagramSvg();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serialized = new XMLSerializer().serializeToString(clone);
  const withHeader = `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`;
  downloadBlob(new Blob([withHeader], { type: 'image/svg+xml' }), filename);
}
