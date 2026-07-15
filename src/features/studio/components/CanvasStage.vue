<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_STROKE,
  PAPER_FILL,
} from '../model/constants';
import { screenToSvgPoint } from '../model/geometry';
import { SHAPE_DRAG_MIME, type ShapeType } from '../model/types';
import { useStudioStore } from '../store/useStudioStore';
import SceneShapeNode from './SceneShapeNode.vue';

const store = useStudioStore();
const svgRef = ref<SVGSVGElement | null>(null);

const draggingId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });

function isShapeType(value: string): value is ShapeType {
  return (
    value === 'rect' ||
    value === 'ellipse' ||
    value === 'triangle' ||
    value === 'diamond'
  );
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  const svg = svgRef.value;
  if (!svg) return;
  const raw = event.dataTransfer?.getData(SHAPE_DRAG_MIME) ?? '';
  if (!isShapeType(raw)) return;
  const pt = screenToSvgPoint(svg, event.clientX, event.clientY);
  store.addShape(raw, pt.x, pt.y);
}

function onShapePointerDown(event: PointerEvent, id: string): void {
  const svg = svgRef.value;
  if (!svg) return;
  event.stopPropagation();
  event.preventDefault();
  const shape = store.shapes.find((s) => s.id === id);
  if (!shape) return;
  store.selectShape(id);
  const pt = screenToSvgPoint(svg, event.clientX, event.clientY);
  dragOffset.value = { x: pt.x - shape.x, y: pt.y - shape.y };
  draggingId.value = id;
  (event.target as Element).setPointerCapture?.(event.pointerId);
}

function onSvgPointerMove(event: PointerEvent): void {
  if (!draggingId.value || !svgRef.value) return;
  const pt = screenToSvgPoint(svgRef.value, event.clientX, event.clientY);
  store.moveShape(
    draggingId.value,
    pt.x - dragOffset.value.x,
    pt.y - dragOffset.value.y,
  );
}

function onSvgPointerUp(): void {
  draggingId.value = null;
}

function onBackgroundPointerDown(): void {
  store.selectShape(null);
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    event.preventDefault();
    store.removeSelected();
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));
</script>

<template>
  <svg
    ref="svgRef"
    class="canvas-stage"
    :viewBox="`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`"
    width="100%"
    height="100%"
    role="application"
    aria-label="Plotter canvas"
    @dragover="onDragOver"
    @drop="onDrop"
    @pointermove="onSvgPointerMove"
    @pointerup="onSvgPointerUp"
    @pointerdown.self="onBackgroundPointerDown"
  >
    <rect :width="CANVAS_WIDTH" :height="CANVAS_HEIGHT" :fill="PAPER_FILL" />
    <g
      :stroke="GRID_STROKE"
      stroke-width="1"
      opacity="0.45"
      pointer-events="none"
    >
      <template v-for="x in 25" :key="`vx-${x}`">
        <path :d="`M ${(x - 1) * 40} 0 V ${CANVAS_HEIGHT}`" />
      </template>
      <template v-for="y in 17" :key="`hy-${y}`">
        <path :d="`M 0 ${(y - 1) * 40} H ${CANVAS_WIDTH}`" />
      </template>
    </g>
    <SceneShapeNode
      v-for="shape in store.shapes"
      :key="shape.id"
      :shape="shape"
      :selected="store.selectedId === shape.id"
      @pointerdown="onShapePointerDown($event, shape.id)"
    />
  </svg>
</template>

<style scoped>
.canvas-stage {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  touch-action: none;
  cursor: default;
}
</style>
