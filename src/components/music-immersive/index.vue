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
  }>(),
  {
    visible: false,
    currentMusic: () => ({} as SongDetailItem),
    lyric: () => [],
    nolyric: false,
    lyricIndex: 0,
  },
);

const emit = defineEmits<{
  (event: 'contextmenu', ev: MouseEvent): void;
}>();

const lyricScrollRef = ref<HTMLDivElement | null>(null);

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
    if (visible) nextTick(scrollToActive);
  },
);
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
</style>
