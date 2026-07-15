<script setup lang="ts">
import { computed } from 'vue';
import { polygonPoints } from '../model/geometry';
import type { SceneShape } from '../model/types';

const props = defineProps<{
  shape: SceneShape;
  selected: boolean;
}>();

const emit = defineEmits<{
  pointerdown: [event: PointerEvent];
}>();

const points = computed(() => polygonPoints(props.shape));
</script>

<template>
  <g
    class="scene-shape"
    :class="{ 'is-selected': selected }"
    :data-id="shape.id"
  >
    <rect
      v-if="shape.type === 'rect'"
      :x="shape.x"
      :y="shape.y"
      :width="shape.width"
      :height="shape.height"
      :fill="shape.fill"
      @pointerdown="emit('pointerdown', $event)"
    />
    <ellipse
      v-else-if="shape.type === 'ellipse'"
      :cx="shape.x + shape.width / 2"
      :cy="shape.y + shape.height / 2"
      :rx="shape.width / 2"
      :ry="shape.height / 2"
      :fill="shape.fill"
      @pointerdown="emit('pointerdown', $event)"
    />
    <polygon
      v-else
      :points="points ?? ''"
      :fill="shape.fill"
      @pointerdown="emit('pointerdown', $event)"
    />
    <rect
      v-if="selected"
      class="scene-shape__ring"
      :x="shape.x - 3"
      :y="shape.y - 3"
      :width="shape.width + 6"
      :height="shape.height + 6"
      fill="none"
      stroke="#ff6b2c"
      stroke-width="2"
      pointer-events="none"
    />
  </g>
</template>
