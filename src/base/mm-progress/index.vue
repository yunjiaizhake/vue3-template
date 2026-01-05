<template>
  <!--进度条拖动-->
  <div ref="mmProgress" class="mmProgress" @click="barClick">
    <div class="mmProgress-bar"></div>
    <div ref="mmPercentProgress" class="mmProgress-outer"></div>
    <div ref="mmProgressInner" class="mmProgress-inner">
      <div
        class="mmProgress-dot"
        @mousedown="barDown"
        @touchstart.prevent="barDown"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const dotWidth = 10;

const props = defineProps({
  // 进度值一
  percent: {
    type: Number,
    default: 0,
  },
  // 进度值二（歌曲缓冲进度用）
  percentProgress: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['percentChange', 'percentChangeEnd']);

const mmProgress = useTemplateRef('mmProgress');
const mmPercentProgress = useTemplateRef('mmPercentProgress');
const mmProgressInner = useTemplateRef('mmProgressInner');

const move = ref({
  status: false, // 是否可拖动
  startX: 0, // 记录最开始点击的X坐标
  left: 0, // 记录当前已经移动的距离
});

// ------------- Watchers -------------
watch(
  () => props.percent,
  (newPercent) => {
    if (newPercent >= 0 && !move.value.status) {
      const barWidth = mmProgress.value.clientWidth - dotWidth;
      const offsetWidth = newPercent * barWidth;
      moveSilde(offsetWidth);
    }
  },
);

watch(
  () => props.percentProgress,
  (newValue) => {
    const offsetWidth = mmProgress.value.clientWidth * newValue;
    mmPercentProgress.value.style.width = `${offsetWidth}px`;
  },
);

// --- Lifecycle ---
onMounted(() => {
  nextTick(() => {
    bindEvents();
    const barWidth = mmProgress.value.clientWidth - dotWidth;
    const offsetWidth = props.percent * barWidth;
    moveSilde(offsetWidth);
  });
});

onBeforeUnmount(() => {
  unbindEvents();
});

// ------------- Methods -------------
function bindEvents() {
  document.addEventListener('mousemove', barMove);
  document.addEventListener('mouseup', barUp);
  document.addEventListener('touchmove', barMove);
  document.addEventListener('touchend', barUp);
}

function unbindEvents() {
  document.removeEventListener('mousemove', barMove);
  document.removeEventListener('mouseup', barUp);
  document.removeEventListener('touchmove', barMove);
  document.removeEventListener('touchend', barUp);
}

// 点击事件
function barClick(e) {
  const rect = mmProgress.value.getBoundingClientRect();
  const offsetWidth = Math.min(
    mmProgress.value.clientWidth - dotWidth,
    Math.max(0, e.clientX - rect.left),
  );
  moveSilde(offsetWidth);
  commitPercent(true);
}

// 鼠标按下事件
function barDown(e) {
  move.value.status = true;
  move.value.startX = e.clientX || e.touches[0].pageX;
  move.value.left = mmProgressInner.value.clientWidth;
}

// 鼠标/触摸移动事件
function barMove(e) {
  if (!move.value.status) return false;
  e.preventDefault();
  const endX = e.clientX || e.touches[0].pageX;
  const dist = endX - move.value.startX;
  const offsetWidth = Math.min(
    mmProgress.value.clientWidth - dotWidth,
    Math.max(0, move.value.left + dist),
  );
  moveSilde(offsetWidth);
  commitPercent();
}

// 鼠标/触摸释放事件
function barUp() {
  if (move.value.status) {
    commitPercent(true);
    move.value.status = false;
  }
}

// 移动滑块
function moveSilde(offsetWidth) {
  mmProgressInner.value.style.width = `${offsetWidth}px`;
}

// 修改 percent
function commitPercent(isEnd = false) {
  const lineWidth = mmProgress.value.clientWidth - dotWidth;
  const percent = mmProgressInner.value.clientWidth / lineWidth;
  emit(isEnd ? 'percentChangeEnd' : 'percentChange', percent);
}
</script>

<style lang="less">
.mmProgress {
  position: relative;
  padding: 5px;
  user-select: none;
  cursor: pointer;
  overflow: hidden;
  .mmProgress-bar {
    height: 2px;
    width: 100%;
    background: @bar_color;
  }
  .mmProgress-outer {
    position: absolute;
    top: 50%;
    left: 5px;
    display: inline-block;
    width: 0;
    height: 2px;
    margin-top: -1px;
    background: rgba(255, 255, 255, 0.2);
  }
  .mmProgress-inner {
    position: absolute;
    top: 50%;
    left: 5px;
    display: inline-block;
    width: 0;
    height: 2px;
    margin-top: -1px;
    background: @line_color;
    .mmProgress-dot {
      position: absolute;
      top: 50%;
      right: -5px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: @dot_color;
      transform: translateY(-50%);
    }
  }
}
</style>
