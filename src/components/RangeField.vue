<script setup lang="ts">
import { computed } from 'vue';
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';

const props = withDefaults(defineProps<{
  label: string;
  description?: string;
  modelValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}>(), { description: '', step: 1, unit: '' });

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const sliderValue = computed({
  get: () => [props.modelValue],
  set: (value: number[]) => emit('update:modelValue', value[0] ?? props.min),
});
</script>

<template>
  <div class="range-field">
    <div class="field-heading">
      <div><label>{{ label }}</label><p v-if="description">{{ description }}</p></div>
      <output>{{ modelValue }}{{ unit }}</output>
    </div>
    <SliderRoot v-model="sliderValue" class="range-slider" :min="min" :max="max" :step="step" :aria-label="label">
      <SliderTrack class="range-track"><SliderRange class="range-range" /></SliderTrack>
      <SliderThumb class="range-thumb" />
    </SliderRoot>
  </div>
</template>
