<script setup lang="ts">
import '../styles/studio.scss';
</script>

<template>
  <div class="studio">
    <header class="studio__header">
      <div class="studio__brand">PLOTTER BENCH</div>
      <div class="studio__actions">
        <slot name="toolbar" />
      </div>
    </header>
    <div class="studio__stage">
      <div class="studio__rail studio__rail--top">
        <slot name="rail-top" />
      </div>
      <div class="studio__rail studio__rail--left">
        <slot name="rail-left" />
      </div>
      <div class="studio__canvas-wrap">
        <slot name="canvas" />
      </div>
      <div class="studio__rail studio__rail--right">
        <slot name="rail-right" />
      </div>
      <div class="studio__rail studio__rail--bottom">
        <slot name="rail-bottom" />
      </div>
    </div>
  </div>
</template>
