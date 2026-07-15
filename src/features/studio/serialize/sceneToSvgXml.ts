import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_STROKE,
  PAPER_FILL,
} from '../model/constants';
import { polygonPoints } from '../model/geometry';
import type { SceneShape } from '../model/types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function shapeToMarkup(shape: SceneShape): string {
  const fill = escapeXml(shape.fill);
  if (shape.type === 'rect') {
    return `<rect id="${escapeXml(shape.id)}" x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${fill}" />`;
  }
  if (shape.type === 'ellipse') {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    return `<ellipse id="${escapeXml(shape.id)}" cx="${cx}" cy="${cy}" rx="${shape.width / 2}" ry="${shape.height / 2}" fill="${fill}" />`;
  }
  const points = polygonPoints(shape);
  return `<polygon id="${escapeXml(shape.id)}" points="${points ?? ''}" fill="${fill}" />`;
}

function gridMarkup(): string {
  const lines: string[] = [];
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    lines.push(`<path d="M ${x} 0 V ${CANVAS_HEIGHT}" />`);
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
    lines.push(`<path d="M 0 ${y} H ${CANVAS_WIDTH}" />`);
  }
  return `<g id="grid" stroke="${GRID_STROKE}" stroke-width="1" opacity="0.45">${lines.join('')}</g>`;
}

export function sceneToSvgXml(shapes: SceneShape[]): string {
  const body = shapes.map(shapeToMarkup).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <desc>Plotter Bench scene</desc>
  <rect id="paper" x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${PAPER_FILL}" />
  ${gridMarkup()}
  ${body}
</svg>
`;
}
