export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'diamond';

export interface SceneShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

export const SHAPE_DRAG_MIME = 'application/x-plotter-shape';

export const ALL_SHAPE_TYPES: ShapeType[] = [
  'rect',
  'ellipse',
  'triangle',
  'diamond',
];
