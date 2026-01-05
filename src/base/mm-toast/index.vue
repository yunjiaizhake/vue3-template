<template>
  <!--弹出层提示-->
  <transition name="toast-fade">
    <div v-if="visible" class="mm-toast" :class="positionClasss">
      {{ message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
const visible = ref(false); // 是否显示
const message = ref(''); // 默认显示文本
const position = ref('center'); // 默认显示位置
const duration = ref(1500); // 显示时间, 毫秒

const positionClasss = computed(() => 'mm-toast-' + position.value);

// 暴露给外部实例，便于插件在运行时赋值控制
defineExpose({ visible, message, position, duration });
</script>

<style lang="less">
@prefix-cls: mm-toast;

.@{prefix-cls} {
  position: fixed;
  left: 50%;
  z-index: 1996;
  max-width: 80%;
  box-sizing: border-box;
  border-radius: @border_radius;
  padding: 10px 20px;
  overflow: hidden;
  text-align: center;
  min-height: 40px;
  line-height: 20px;
  font-size: 14px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  user-select: none;
  transform: translateX(-50%);
  &&-top {
    top: 10%;
  }
  &&-center {
    top: 50%;
    margin-top: -20px;
  }
  &&-bottom {
    bottom: 10%;
  }
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translate3d(-50%, -10px, 0);
}

.toast-fade-enter-active {
  will-change: transform;
  transition: all 0.5s;
}

.toast-fade-enter-to {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
}

.toast-fade-leave-from {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
}

.toast-fade-leave-active {
  will-change: transform, opacity;
  transition: all 0.5s;
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translate3d(-50%, 10px, 0);
}
</style>
