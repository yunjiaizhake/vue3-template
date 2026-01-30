<template>
  <!--进度条拖动-->
  <div ref="bbprogress" class="bbprogress" @click="barClick">
    <div class="bbprogress-bar"></div>
    <div ref="bbPercentProgress" class="bbprogress-outer"></div>
    <div
      v-for="(left, index) in markerPositions"
      :key="index"
      class="bbprogress-marker"
      :style="{ left: `${left}px` }"
    ></div>
    <div ref="bbProgressInner" class="bbprogress-inner">
      <!--  @touchstart.prevent="barDown" -->
      <div class="bbprogress-dot" @mousedown="barDown"></div>
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
  // 副歌部分标记点（0-1）
  markers: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
});

const emit = defineEmits(['percentChange', 'percentChangeEnd']);

const bbprogress = useTemplateRef<HTMLInputElement | null>('bbprogress');
const bbPercentProgress = useTemplateRef<HTMLInputElement | null>(
  'bbPercentProgress',
);
const bbProgressInner = useTemplateRef<HTMLInputElement | null>(
  'bbProgressInner',
);

const markerPositions = ref<number[]>([]);

const move = ref({
  status: false, // 是否可拖动
  startX: 0, // 记录最开始点击的X坐标
  left: 0, // 记录当前已经移动的距离
});

// ------------------------------ Watchers ------------------------------
watch(
  () => props.percent,
  (newPercent) => {
    if (newPercent >= 0 && !move.value.status) {
      const barWidth = bbprogress.value!.clientWidth - dotWidth;
      const offsetWidth = newPercent * barWidth;
      moveSilde(offsetWidth);
    }
  },
);

watch(
  () => props.percentProgress,
  (newValue) => {
    const offsetWidth = bbprogress.value!.clientWidth * newValue;
    bbPercentProgress.value!.style.width = `${offsetWidth}px`;
  },
);

watch(
  () => props.markers,
  () => {
    nextTick(() => updateMarkers());
  },
  { deep: true },
);

// ------------------------------ 生命周期 -------------------------------
onMounted(() => {
  nextTick(() => {
    bindEvents();
    const barWidth = bbprogress.value!.clientWidth - dotWidth;
    const offsetWidth = props.percent * barWidth;
    moveSilde(offsetWidth);
    updateMarkers();
  });
});

onBeforeUnmount(() => {
  unbindEvents();
});

// ------------------------------ 方法 -------------------------------
function bindEvents() {
  document.addEventListener('mousemove', barMove);
  document.addEventListener('mouseup', barUp);
  // document.addEventListener('touchmove', barMove);
  // document.addEventListener('touchend', barUp);
}

function unbindEvents() {
  document.removeEventListener('mousemove', barMove);
  document.removeEventListener('mouseup', barUp);
  // document.removeEventListener('touchmove', barMove);
  // document.removeEventListener('touchend', barUp);
}

// 点击事件
function barClick(e: MouseEvent) {
  const rect = bbprogress.value!.getBoundingClientRect();
  const offsetWidth = Math.min(
    bbprogress.value!.clientWidth - dotWidth,
    Math.max(0, e.clientX - rect.left),
  );
  moveSilde(offsetWidth);
  commitPercent(true);
}

// 鼠标按下事件
function barDown(e: MouseEvent) {
  move.value.status = true;
  // move.value.startX = e.clientX || e.touches[0].pageX;
  move.value.startX = e.clientX;
  move.value.left = bbProgressInner.value!.clientWidth;
}

// 鼠标/触摸移动事件
function barMove(e: MouseEvent) {
  if (!move.value.status) return false;
  e.preventDefault();
  // const endX = e.clientX || e.touches[0].pageX;
  const endX = e.clientX;
  const dist = endX - move.value.startX;
  const offsetWidth = Math.min(
    bbprogress.value!.clientWidth - dotWidth,
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
function moveSilde(offsetWidth: number) {
  bbProgressInner.value!.style.width = `${offsetWidth}px`;
}

// 修改 percent
function commitPercent(isEnd = false) {
  const lineWidth = bbprogress.value!.clientWidth - dotWidth;
  const percent = bbProgressInner.value!.clientWidth / lineWidth;
  emit(isEnd ? 'percentChangeEnd' : 'percentChange', percent);
}

function updateMarkers() {
  const barWidth = bbprogress.value!.clientWidth - dotWidth;
  markerPositions.value = props.markers.map((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    return 5 + clamped * barWidth;
  });
}
</script>

<style lang="less">
.bbprogress {
  position: relative;
  padding: 5px;
  user-select: none;
  cursor: pointer;
  overflow: hidden;
  .bbprogress-bar {
    height: 2px;
    width: 100%;
    background: @bar_color;
  }
  .bbprogress-outer {
    position: absolute;
    top: 50%;
    left: 5px;
    display: inline-block;
    width: 0;
    height: 2px;
    margin-top: -1px;
    background: rgba(255, 255, 255, 0.2);
  }
  .bbprogress-inner {
    position: absolute;
    top: 50%;
    left: 5px;
    display: inline-block;
    width: 0;
    height: 2px;
    margin-top: -1px;
    background: @line_color;
    .bbprogress-dot {
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

  .bbprogress-marker {
    position: absolute;
    top: 50%;
    width: 6px;
    height: 6px;
    margin-top: -3px;
    border-radius: 50%;
    background: #fff;
    pointer-events: none;
  }
}
</style>
