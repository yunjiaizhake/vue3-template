<script setup lang="ts">
import type { ShapeType } from '../model/types';
import ShapeChip from './ShapeChip.vue';

defineProps<{ types: ShapeType[] }>();
</script>

<template>
  <div class="shape-palette">
    <ShapeChip
      v-for="(t, i) in types"
      :key="`${t}-${i}`"
      :type="t"
      :style="{ animationDelay: `${i * 40}ms` }"
    />
  </div>
</template>

<style scoped>
.shape-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}
</style>
