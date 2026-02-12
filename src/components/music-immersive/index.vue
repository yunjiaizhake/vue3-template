<template>
  <transition name="immersive-fade">
    <div
      v-show="visible"
      class="music-immersive"
      @contextmenu.prevent="handleContextMenu"
    >
      <div class="immersive-bg" :style="{ backgroundImage: backgroundUrl }"></div>
      <div class="immersive-mask"></div>
      <div class="immersive-content">
        <div class="immersive-left">
          <div class="cover-wrapper">
            <img
              :src="musicPicUrl"
              :alt="currentMusic?.name || 'cover'"
              draggable="false"
            />
          </div>
          <div v-if="currentMusic?.id" class="cover-info">
            <div class="name">{{ currentMusic.name }}</div>
            <div class="singer">{{ currentMusic.singer }}</div>
          </div>
          <div v-else class="cover-empty">还没有播放音乐哦！</div>
        </div>
        <div class="immersive-right">
          <div ref="lyricScrollRef" class="lyric-scroll">
            <p v-if="!currentMusic?.id">请选择一首歌曲</p>
            <p v-else-if="nolyric">暂无歌词</p>
            <template v-else>
              <p
                v-for="(item, index) in lyric"
                :key="index"
                :data-lyric-index="index"
                :class="{ active: lyricIndex === index }"
              >
                {{ item.text }}
              </p>
            </template>
          </div>
        </div>
      </div>
       <div class="immersive-visualizer" aria-hidden="true">
        <span
          v-for="(level, index) in barLevels"
          :key="index"
          class="visualizer-bar"
          :style="{
            transform: `scaleY(${level})`,
            opacity: `${0.35 + level * 0.55}`,
          }"
        />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import playerCover from '@/assets/img/player_cover.png';
import type { SongDetailItem, LyricLine } from '@/types/dataTypes';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    currentMusic: SongDetailItem;
    lyric: LyricLine[];
    nolyric: boolean;
    lyricIndex: number;
    playing: boolean;
  }>(),
  {
    visible: false,
    currentMusic: () => ({} as SongDetailItem),
    lyric: () => [],
    nolyric: false,
    lyricIndex: 0,
    playing: false,
  },
);

const emit = defineEmits<{
  (event: 'contextmenu', ev: MouseEvent): void;
}>();

/**
 * 频谱数据按“中心对称镜像”渲染：
 * 从中心向两侧展开同一组频段，左右柱条高度保持对称。
 */
const VISUALIZER_BAR_COUNT = 52; // 可视化柱条数量
const BASE_LEVEL = 0.08; // 柱条最小高度（scaleY 基线）
const NOISE_GATE = 0.018; // 小能量噪声门限，低于该值按静音处理
const JITTER_DELTA = 0.012; // 帧间最小变化阈值，小于该值视为抖动
const LEVEL_STEP = 0.008; // 高度量化步进，抑制细碎高频抖动

const lyricScrollRef = ref<HTMLDivElement | null>(null); // 歌词滚动容器
// 每个柱条对应一个 scaleY 值，驱动模板中的 transform 动画。
const barLevels = ref<number[]>(
  Array.from({ length: VISUALIZER_BAR_COUNT }, () => BASE_LEVEL),
);

let rafId = 0; // requestAnimationFrame 句柄
let audioCtx: AudioContext | null = null; // Web Audio 上下文
let analyser: AnalyserNode | null = null; // 频谱分析节点
let sourceNode: MediaElementAudioSourceNode | null = null; // audio 元素输入节点
let frequencyData: Uint8Array<ArrayBuffer> | null = null; // 频域数据缓存（0-255）

// 停止播放或切歌时回落到低振幅，避免柱条突然归零。
const resetBars = () => {
  barLevels.value = Array.from(
    { length: VISUALIZER_BAR_COUNT },
    () => BASE_LEVEL + Math.random() * 0.02,
  );
};

// 统一管理 requestAnimationFrame 的停止与重置。
const stopVisualizer = (reset = true) => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  if (reset) resetBars();
};

// 对柱条高度做“门限 + 量化 + 包络”处理，减少顶点细碎抖动。
const resolveNextLevel = (prevLevel: number, rawTarget: number) => {
  const gatedTarget =
    rawTarget < BASE_LEVEL + NOISE_GATE ? BASE_LEVEL : rawTarget;
  const quantizedTarget =
    Math.round(gatedTarget / LEVEL_STEP) * LEVEL_STEP;
  if (Math.abs(quantizedTarget - prevLevel) < JITTER_DELTA) {
    return prevLevel;
  }
  return quantizedTarget > prevLevel
    ? quantizedTarget
    : Math.max(BASE_LEVEL, prevLevel * 0.86);
};

// 获取页面中的全局 audio 元素（由 App.vue 挂载）。
const getPlayerAudioElement = () => {
  return document.querySelector('audio') as HTMLAudioElement | null;
};

// 构建 Web Audio 分析链路：audio -> analyser -> destination。
const ensureVisualizerGraph = async () => {
  const audioElement = getPlayerAudioElement();
  if (!audioElement) return false;

  if (analyser && sourceNode && frequencyData) {
    if (audioCtx?.state === 'suspended') {
      await audioCtx.resume();
    }
    return true;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext; // 兼容旧版 Safari 的 webkitAudioContext

  if (!AudioContextCtor) return false;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextCtor(); // 首次进入或被关闭后，创建音频上下文
  }

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume(); // 浏览器自动挂起后恢复，确保可以持续产出分析数据
  }

  if (!sourceNode) {
    sourceNode = audioCtx.createMediaElementSource(audioElement); // 把 <audio> 元素接入 Web Audio 图
  }

  analyser = audioCtx.createAnalyser(); // 频谱分析节点，后续从这里读取 FFT 结果
  analyser.fftSize = 256; // FFT 窗口大小，决定频率分辨率与刷新平滑度
  analyser.smoothingTimeConstant = 0.78; // 时间平滑，减小帧间抖动，为 0 时每帧瞬间跳转，为 1 时冻结不冻
  frequencyData = new Uint8Array(
    analyser.frequencyBinCount,
  ) as Uint8Array<ArrayBuffer>; // 频域数据缓存，每个值范围 0~255

  sourceNode.connect(analyser); // 音频流从 source 进入 analyser
  analyser.connect(audioCtx.destination); // 继续输出到扬声器，保证仍可正常听到声音
  return true;
};

// 真实频谱动画：用 AnalyserNode 的 FFT 结果驱动柱条高度。
const updateVisualizer = () => {
  if (!props.visible || !props.currentMusic?.id) {
    stopVisualizer();
    return;
  }

  const currentAnalyser = analyser;
  const currentFrequencyData = frequencyData;
  const canAnalyze = props.playing && !!currentAnalyser && !!currentFrequencyData; // 仅在播放且分析链路就绪时采样
  if (canAnalyze) {
    currentAnalyser.getByteFrequencyData(currentFrequencyData); // 读取当前帧频谱能量到 Uint8Array
  }

  if (!canAnalyze || !currentFrequencyData) {
    barLevels.value = barLevels.value.map((prev) => Math.max(BASE_LEVEL, prev * 0.9)); // 暂停/不可分析时平滑回落
    rafId = requestAnimationFrame(updateVisualizer); // 保持循环，等待下一帧状态恢复
    return;
  }

  const spectrumLength = currentFrequencyData.length; // FFT 输出频段总数（= frequencyBinCount）
  const usedBins = Math.max(1, Math.floor(spectrumLength * 0.85)); // 只取前 85% 频段，避免高频噪声过多
  const halfBarCount = Math.ceil(VISUALIZER_BAR_COUNT / 2); // 镜像渲染只计算半边柱条
  const binsPerHalfBar = Math.max(1, Math.floor(usedBins / halfBarCount)); // 每个半边柱条平均对应的频段数
  const leftCenter = Math.floor((VISUALIZER_BAR_COUNT - 1) / 2); // 左半边的中心起点索引
  const rightCenter = Math.ceil((VISUALIZER_BAR_COUNT - 1) / 2); // 右半边的中心起点索引
  const nextLevels = [...barLevels.value]; // 先拷贝一份，统一算完再提交，避免中途相互影响

  for (let i = 0; i < halfBarCount; i++) {
    const start = i * binsPerHalfBar; // 当前柱条对应频段块的起始 bin
    const end = Math.min(usedBins, start + binsPerHalfBar); // 当前柱条对应频段块的结束 bin（不含）
    let sum = 0; // 当前频段块能量总和
    for (let j = start; j < end; j++) {
      sum += currentFrequencyData[j]!; // 累加该频段块内每个 bin 的幅值
    }

    const avg = end > start ? sum / (end - start) : 0; // 频段块平均能量，降低单点尖峰影响
    const normalized = avg / 255; // 归一化到 0~1
    // 把高频门槛放低一点，并对外侧（高频）做轻微增益，避免长期“贴地”不跳动。
    const detailEnergy = Math.pow(normalized, 1.05); // 非线性映射，提升中低能量可见性
    const highBoost = 0.92 + (i / Math.max(1, halfBarCount - 1)) * 0.62; // 越外侧（高频）增益越高
    const energy = Math.min(1, detailEnergy * highBoost); // 限幅，避免超过 1
    const target = BASE_LEVEL + energy * 0.98; // 映射为柱条目标高度（scaleY）
    const leftIndex = leftCenter - i; // 左半边镜像索引
    const rightIndex = rightCenter + i; // 右半边镜像索引

    if (leftIndex >= 0) {
      const prevLeft = barLevels.value[leftIndex]!; // 左侧柱条上一帧高度
      nextLevels[leftIndex] = resolveNextLevel(prevLeft, target); // 经过去抖后再更新
    }

    if (rightIndex < VISUALIZER_BAR_COUNT) {
      const prevRight = barLevels.value[rightIndex]!; // 右侧柱条上一帧高度
      nextLevels[rightIndex] = resolveNextLevel(prevRight, target); // 与左侧同样去抖规则
    }
  }

  barLevels.value = nextLevels;
  rafId = requestAnimationFrame(updateVisualizer);
};

// 启动可视化循环：先确保分析链路可用，再进入逐帧更新。
const startVisualizer = () => {
  if (rafId || !props.visible || !props.currentMusic?.id) return;
  ensureVisualizerGraph().finally(() => {
    if (!rafId && props.visible && props.currentMusic?.id) {
      updateVisualizer();
    }
  });
};

const musicPicUrl = computed(() => {
  return props.currentMusic?.id
    ? `${props.currentMusic.image}?param=500y500`
    : playerCover;
});

const backgroundUrl = computed(() => {
  const url = props.currentMusic?.id
    ? `${props.currentMusic.image}?param=900y900`
    : playerCover;
  return `url(${url})`;
});

// 将当前高亮歌词滚动到视窗中间。
const scrollToActive = () => {
  if (!props.visible) return;
  const container = lyricScrollRef.value;
  if (!container) return;
  const active = container.querySelector(
    `[data-lyric-index="${props.lyricIndex}"]`,
  ) as HTMLElement | null;
  // scrollIntoView 浏览器原生 API，自动将当前容器滚动到浏览器中间
  active?.scrollIntoView({ block: 'center', behavior: 'smooth' });
};

// 透传右键事件给父组件，复用主页面的上下文菜单。
const handleContextMenu = (event: MouseEvent) => {
  emit('contextmenu', event);
};

watch(
  () => props.lyricIndex,
  () => nextTick(scrollToActive),
);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(scrollToActive);
      // 沉浸页显示时启动可视化循环。
      startVisualizer();
      return;
    }
    // 沉浸页隐藏时立即停止，释放动画帧开销。
    stopVisualizer();
  },
);

watch(
  () => props.currentMusic?.id,
  (id) => {
    if (!id) {
      stopVisualizer();
      return;
    }
    // 切歌后若页面可见，重新驱动柱条进入新节奏。
    if (props.visible) startVisualizer();
  },
);

watch(
  () => props.playing,
  () => {
    if (props.visible && props.currentMusic?.id) startVisualizer();
  },
);

onBeforeUnmount(() => {
  stopVisualizer();
  analyser?.disconnect();
  sourceNode?.disconnect();
  if (audioCtx && audioCtx.state !== 'closed') {
    void audioCtx.close();
  }
  analyser = null;
  sourceNode = null;
  frequencyData = null;
  audioCtx = null;
});
</script>

<style lang="less" scoped>
.music-immersive {
  position: fixed;
  inset: 0;
  z-index: 9000;
  overflow: hidden;
  color: #fff;
  user-select: none;
  -webkit-user-select: none;
}

.immersive-bg,
.immersive-mask {
  position: absolute;
  inset: 0;
}

.immersive-bg {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  filter: blur(10px);
  transform: scale(1.08);
}

.immersive-mask {
  background: rgba(0, 0, 0, 0.55);
}

.immersive-content {
  position: relative;
  z-index: 2;
  display: flex;
  height: 100%;
  padding: 40px 60px;
  box-sizing: border-box;
  gap: 40px;
  perspective: 1200px;
}

.immersive-left {
  width: 40%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  transform: rotateY(10deg) translateZ(20px);
  transform-style: preserve-3d;
}

.cover-wrapper {
  width: min(420px, 80%);
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-user-drag: none;
    user-select: none;
  }
}

.cover-info {
  text-align: center;
  .name {
    font-size: 24px;
    font-weight: 600;
  }
  .singer {
    margin-top: 6px;
    font-size: 16px;
    opacity: 0.8;
  }
}

.cover-empty {
  font-size: 18px;
  opacity: 0.8;
}

.immersive-right {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  justify-content: center;
  transform: rotateY(-8deg) translateZ(16px);
  transform-style: preserve-3d;
}

.lyric-scroll {
  width: 80%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px 20px;
  font-size: 18px;
  line-height: 1.9;
  text-align: center;
  scrollbar-width: none;
  -ms-overflow-style: none;
  p {
    margin: 0;
    padding: 6px 0;
    opacity: 0.7;
    transition: all 0.2s ease;
  }
  .active {
    opacity: 1;
    font-size: 22px;
    color: #00d9c0;
    transform: scale(1.2);
  }
}

:deep(.lyric-scroll::-webkit-scrollbar) {
  width: 0;
  height: 0;
}

.immersive-fade-enter-active,
.immersive-fade-leave-active {
  transition: opacity 0.25s ease;
}
.immersive-fade-enter-from,
.immersive-fade-leave-to {
  opacity: 0;
}

.immersive-visualizer {
  position: absolute;
  z-index: 3;
  left: 32px;
  right: 32px;
  bottom: 14px;
  height: 74px;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  pointer-events: none;
}

.visualizer-bar {
  flex: 1;
  min-width: 2px;
  height: 100%;
  transform-origin: center bottom;
  transform: scaleY(0.08);
  border-radius: 999px 999px 2px 2px;
  background: linear-gradient(
    to top,
    rgba(232, 235, 239, 0.35),
    rgba(249, 251, 253, 0.94)
  );
  box-shadow: 0 0 8px rgba(248, 250, 253, 0.35);
  transition:
    transform 70ms linear,
    opacity 100ms ease;
}
</style>
