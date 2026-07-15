import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_SIZE,
} from './constants';
import type { SceneShape, ShapeType } from './types';

export function createShape(
  type: ShapeType,
  centerX: number,
  centerY: number,
  id: string = crypto.randomUUID(),
): SceneShape {
  const size = DEFAULT_SHAPE_SIZE;
  return {
    id,
    type,
    x: centerX - size / 2,
    y: centerY - size / 2,
    width: size,
    height: size,
    fill: DEFAULT_SHAPE_FILL,
  };
}

export function polygonPoints(
  shape: Pick<SceneShape, 'type' | 'x' | 'y' | 'width' | 'height'>,
): string | null {
  const { x, y, width, height, type } = shape;
  if (type === 'triangle') {
    return `${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`;
  }
  if (type === 'diamond') {
    return `${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`;
  }
  return null;
}

/** Keep at least 1px of the shape inside the canvas. */
export function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: Math.min(CANVAS_WIDTH - 1, Math.max(1 - width, x)),
    y: Math.min(CANVAS_HEIGHT - 1, Math.max(1 - height, y)),
  };
}

export function screenToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}
