<script setup lang="ts">
import { downloadScene } from '../serialize/downloadScene';
import { useStudioStore } from '../store/useStudioStore';

const store = useStudioStore();

function onClear(): void {
  store.clearShapes();
}

function onExportSvg(): void {
  downloadScene(store.shapes, 'svg');
}

function onExportXml(): void {
  downloadScene(store.shapes, 'xml');
}
</script>

<template>
  <div class="studio-toolbar">
    <button type="button" class="btn btn--ghost" @click="onClear">Clear</button>
    <button type="button" class="btn btn--signal" @click="onExportSvg">
      Export SVG
    </button>
    <button
      type="button"
      class="btn btn--ghost"
      title="Some browsers show XML as a source tree. Prefer Export SVG to view the drawing."
      @click="onExportXml"
    >
      Export XML
    </button>
  </div>
</template>

<style scoped lang="scss">
.studio-toolbar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  font-family: var(--font-body, 'IBM Plex Sans', sans-serif);
  font-size: 0.9rem;
  border-radius: 999px;
  padding: 0.45rem 0.95rem;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn:focus-visible {
  outline: 2px solid #ff6b2c;
  outline-offset: 2px;
}

.btn--ghost {
  background: transparent;
  color: #e7eef5;
  border-color: rgba(255, 255, 255, 0.25);
}

.btn--signal {
  background: #ff6b2c;
  color: #152033;
  font-weight: 600;
}
</style>
