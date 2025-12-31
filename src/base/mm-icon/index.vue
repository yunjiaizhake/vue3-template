<script setup>
const props = defineProps({
  type: { type: String, required: true },
  size: { type: Number, default: 16 },
});

const emit = defineEmits(['click']);

// 保持原来的函数和变量名字
function getIconCls() {
  return `icon-${props.type}`;
}

function getIconStyle() {
  return { fontSize: props.size + 'px' };
}

function onClick(e) {
  emit('click', e);
}
</script>

<template>
  <i
    class="iconfont"
    :class="getIconCls()"
    :style="getIconStyle()"
    @click="onClick"
  />
</template>

<style lang="less">
.iconfont {
  display: inline-block;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  line-height: 1;
  vertical-align: baseline;
  text-transform: none;
  speak: none;
  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
