<script setup lang="ts">
import CanvasStage from '@/features/studio/components/CanvasStage.vue';
import ShapePalette from '@/features/studio/components/ShapePalette.vue';
import StudioShell from '@/features/studio/components/StudioShell.vue';
import StudioToolbar from '@/features/studio/components/StudioToolbar.vue';
import type { ShapeType } from '@/features/studio/model/types';

const top: ShapeType[] = ['rect', 'ellipse', 'triangle', 'diamond'];
const left: ShapeType[] = ['diamond', 'rect', 'ellipse'];
const right: ShapeType[] = ['triangle', 'diamond', 'rect'];
const bottom: ShapeType[] = ['ellipse', 'triangle', 'rect', 'diamond'];
</script>

<template>
  <StudioShell>
    <template #toolbar>
      <StudioToolbar />
    </template>
    <template #rail-top>
      <ShapePalette :types="top" />
    </template>
    <template #rail-left>
      <ShapePalette :types="left" />
    </template>
    <template #rail-right>
      <ShapePalette :types="right" />
    </template>
    <template #rail-bottom>
      <ShapePalette :types="bottom" />
    </template>
    <template #canvas>
      <CanvasStage />
    </template>
  </StudioShell>
</template>
