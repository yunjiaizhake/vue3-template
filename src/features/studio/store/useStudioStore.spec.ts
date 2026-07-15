import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useStudioStore } from './useStudioStore';

describe('useStudioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds a shape and selects it', () => {
    const store = useStudioStore();
    const shape = store.addShape('ellipse', 50, 60);
    expect(store.shapes).toHaveLength(1);
    expect(store.selectedId).toBe(shape.id);
    expect(shape.type).toBe('ellipse');
  });

  it('moves a shape with clamping', () => {
    const store = useStudioStore();
    const shape = store.addShape('rect', 40, 40);
    store.moveShape(shape.id, -500, -500);
    const moved = store.shapes[0];
    expect(moved).toBeDefined();
    expect(moved!.x).toBeGreaterThan(-moved!.width);
    expect(moved!.y).toBeGreaterThan(-moved!.height);
  });

  it('removes the selection', () => {
    const store = useStudioStore();
    store.addShape('rect', 10, 10);
    store.removeSelected();
    expect(store.shapes).toHaveLength(0);
    expect(store.selectedId).toBeNull();
  });

  it('clears all shapes', () => {
    const store = useStudioStore();
    store.addShape('rect', 10, 10);
    store.addShape('diamond', 20, 20);
    store.clearShapes();
    expect(store.shapes).toHaveLength(0);
  });
});
