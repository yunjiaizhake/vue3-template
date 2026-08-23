<script setup lang="ts">
import { computed } from 'vue';
import { Minus, Plus } from '@lucide/vue';

const props = defineProps<{
  label: string;
  description?: string;
  modelValue: number;
  min: number;
  max: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const canDecrease = computed(() => props.modelValue > props.min);
const canIncrease = computed(() => props.modelValue < props.max);

function update(value: number) {
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, value)));
}
</script>

<template>
  <div class="count-field">
    <div class="field-heading">
      <div><label>{{ label }}</label><p v-if="description">{{ description }}</p></div>
      <output>{{ modelValue }}</output>
    </div>
    <div class="stepper" role="group" :aria-label="label">
      <button type="button" :disabled="!canDecrease" :aria-label="`减少 ${label}`" @click="update(modelValue - 1)"><Minus :size="14" /></button>
      <span aria-live="polite">{{ modelValue }}</span>
      <button type="button" :disabled="!canIncrease" :aria-label="`增加 ${label}`" @click="update(modelValue + 1)"><Plus :size="14" /></button>
    </div>
  </div>
</template>
