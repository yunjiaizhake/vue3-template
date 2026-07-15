<script setup lang="ts">
import { SHAPE_DRAG_MIME, type ShapeType } from '../model/types';

const props = defineProps<{ type: ShapeType }>();

function onDragStart(event: DragEvent): void {
  event.dataTransfer?.setData(SHAPE_DRAG_MIME, props.type);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
}
</script>

<template>
  <button
    class="shape-chip"
    type="button"
    draggable="true"
    :aria-label="`Drag ${type}`"
    @dragstart="onDragStart"
  >
    <svg class="shape-chip__preview" viewBox="0 0 40 40" aria-hidden="true">
      <rect
        v-if="type === 'rect'"
        x="8"
        y="8"
        width="24"
        height="24"
        fill="currentColor"
      />
      <ellipse
        v-else-if="type === 'ellipse'"
        cx="20"
        cy="20"
        rx="12"
        ry="10"
        fill="currentColor"
      />
      <polygon
        v-else-if="type === 'triangle'"
        points="20,6 34,34 6,34"
        fill="currentColor"
      />
      <polygon v-else points="20,6 34,20 20,34 6,20" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped lang="scss">
.shape-chip {
  width: 52px;
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #d7e6f2;
  cursor: grab;
  display: grid;
  place-items: center;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.shape-chip:active {
  cursor: grabbing;
}

.shape-chip:hover {
  background: rgba(255, 107, 44, 0.18);
  color: #ff6b2c;
}

.shape-chip:focus-visible {
  outline: 2px solid #ff6b2c;
  outline-offset: 2px;
}

.shape-chip__preview {
  width: 28px;
  height: 28px;
}

@media (prefers-reduced-motion: no-preference) {
  .shape-chip {
    animation: chip-in 420ms ease both;
  }

  @keyframes chip-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
