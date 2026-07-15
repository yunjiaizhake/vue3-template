import { describe, expect, it } from 'vitest';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_SHAPE_SIZE,
} from './constants';
import { clampPosition, createShape, polygonPoints } from './geometry';

describe('createShape', () => {
  it('centers a rect on the drop point', () => {
    const shape = createShape('rect', 100, 200, 'id-1');
    expect(shape).toMatchObject({
      id: 'id-1',
      type: 'rect',
      x: 100 - DEFAULT_SHAPE_SIZE / 2,
      y: 200 - DEFAULT_SHAPE_SIZE / 2,
      width: DEFAULT_SHAPE_SIZE,
      height: DEFAULT_SHAPE_SIZE,
    });
  });
});

describe('polygonPoints', () => {
  it('returns null for rect and ellipse', () => {
    expect(polygonPoints({ type: 'rect', x: 0, y: 0, width: 10, height: 10 })).toBeNull();
    expect(
      polygonPoints({ type: 'ellipse', x: 0, y: 0, width: 10, height: 10 }),
    ).toBeNull();
  });

  it('builds a triangle pointing up', () => {
    const pts = polygonPoints({
      type: 'triangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(pts).toBe('50,0 100,100 0,100');
  });

  it('builds a diamond', () => {
    const pts = polygonPoints({
      type: 'diamond',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(pts).toBe('50,0 100,50 50,100 0,50');
  });
});

describe('clampPosition', () => {
  it('keeps shapes at least partially visible', () => {
    expect(clampPosition(-1000, -1000, 80, 80)).toEqual({
      x: -80 + 1,
      y: -80 + 1,
    });
    expect(clampPosition(5000, 5000, 80, 80)).toEqual({
      x: CANVAS_WIDTH - 1,
      y: CANVAS_HEIGHT - 1,
    });
  });
});
