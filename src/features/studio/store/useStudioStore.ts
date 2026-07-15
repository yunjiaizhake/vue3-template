import { defineStore } from 'pinia';
import { ref } from 'vue';
import { clampPosition, createShape } from '../model/geometry';
import type { SceneShape, ShapeType } from '../model/types';

export const useStudioStore = defineStore('studio', () => {
  const shapes = ref<SceneShape[]>([]);
  const selectedId = ref<string | null>(null);

  function addShape(type: ShapeType, centerX: number, centerY: number): SceneShape {
    const shape = createShape(type, centerX, centerY);
    const clamped = clampPosition(shape.x, shape.y, shape.width, shape.height);
    shape.x = clamped.x;
    shape.y = clamped.y;
    shapes.value.push(shape);
    selectedId.value = shape.id;
    return shape;
  }

  function selectShape(id: string | null): void {
    selectedId.value = id;
  }

  function moveShape(id: string, x: number, y: number): void {
    const shape = shapes.value.find((s) => s.id === id);
    if (!shape) return;
    const clamped = clampPosition(x, y, shape.width, shape.height);
    shape.x = clamped.x;
    shape.y = clamped.y;
  }

  function removeSelected(): void {
    if (!selectedId.value) return;
    shapes.value = shapes.value.filter((s) => s.id !== selectedId.value);
    selectedId.value = null;
  }

  function clearShapes(): void {
    shapes.value = [];
    selectedId.value = null;
  }

  return {
    shapes,
    selectedId,
    addShape,
    selectShape,
    moveShape,
    removeSelected,
    clearShapes,
  };
});
