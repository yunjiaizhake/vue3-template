<template>
  <div class="music flex-col">
    <div class="music-content">
      <div class="music-left flex-col">
        <music-btn @onClickLyric="handleOpenLyric" />
        <router-view v-slot="{ Component }">
          <keep-alive v-if="route.meta.keepAlive">
            <component :is="Component" class="router-view" />
          </keep-alive>
          <component
            v-else
            :is="Component"
            :key="$route.fullPath"
            class="router-view"
          />
        </router-view>
        <!-- <router-view
          v-if="!$route.meta.keepAlive"
          :key="$route.path"
          class="router-view"
        /> -->
      </div>
      <div class="music-right" :class="{ show: lyricVisible }">
        <div class="close-lyric" @click="handleCloseLyric">关闭歌词</div>
        <lyric
          ref="lyricRef"
          :lyric="lyric"
          :nolyric="nolyric"
          :lyric-index="lyricIndex"
        />
      </div>
    </div>

    <!--播放器-->
    <div
      class="music-bar"
      :class="{ disable: !musicReady || !currentMusic.id }"
    >
      <div class="music-bar-btns">
        <bb-icon
          class="pointer"
          type="prev"
          :size="30"
          title="上一曲 Ctrl + Left"
          @click="prev"
        />
        <div
          class="control-play pointer"
          title="播放暂停 Ctrl + Space"
          @click="play"
        >
          <bb-icon
            :type="playing ? 'pause' : 'play'"
            :size="24"
            :class="{ 'play-shift': !playing }"
          />
        </div>
        <bb-icon
          class="pointer"
          type="next"
          :size="30"
          title="下一曲 Ctrl + Right"
          @click="next"
        />
      </div>
      <div class="music-music">
        <div class="music-bar-info">
          <template v-if="currentMusic && currentMusic.id">
            {{ currentMusic.name }}
            <span>- {{ currentMusic.singer }}</span>
          </template>
          <template v-else>欢迎使用BbPlayer在线音乐播放器</template>
        </div>
        <div v-if="currentMusic.id" class="music-bar-time">
          {{ format(currentTime) }}/{{ format(currentMusic.duration % 3600) }}
        </div>
        <bb-progress
          class="music-progress"
          :percent="percentMusic"
          :percent-progress="currentProgress"
          @percentChange="progressMusic"
          @percentChangeEnd="progressMusicEnd"
        />
      </div>

      <!-- 播放模式 -->
      <bb-icon
        class="icon-color pointer mode"
        :type="getModeIconType()"
        :title="getModeIconTitle()"
        :size="30"
        @click="modeChange"
      />

      <!-- 评论 -->
      <bb-icon
        class="icon-color pointer comment"
        type="comment"
        :size="28"
        @click="openComment"
      />

      <!-- 音量控制 -->
      <div class="music-bar-volume" title="音量加减 [Ctrl + Up / Down]">
        <volume :volume="volume" @volumeChange="volumeChange" ref="volumeRef" />
      </div>
    </div>

    <!--遮罩-->
    <div class="mmPlayer-bg" :style="{ backgroundImage: picUrl }"></div>
    <div class="mmPlayer-mask"></div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/index.ts';
import { getLyric } from '@/api';
import bbPlayerMusic from './bbPlayer';
import {
  randomSortArray,
  parseLyric,
  format,
  silencePromise,
} from '@/utils/util';
import { PLAY_MODE, MMPLAYER_CONFIG } from '@/config';
import { getVolume, setVolume } from '@/utils/storage';
import { searchAndPlay } from '@/utils/aiplay';

import BbProgress from '@/base/bb-progress/index.vue';
import MusicBtn from '@/components/music-btn/index.vue';
import Lyric from '@/components/lyric/index.vue';
import Volume, { type ChildExpose } from '@/components/volume/index.vue';
import type { SongDetailItem, LyricLine } from '@/types/dataTypes';
import { useAiEventBusStore } from '@/stores/aiEventBus';

// ------------------------------ 数据 ------------------------------
const volume = ref<number>(getVolume());
const musicReady = ref<boolean>(false);
const currentTime = ref<number>(0);
const currentProgress = ref<number>(0);
const lyricVisible = ref<boolean>(false);
const lyric = ref<LyricLine[]>([]);
const nolyric = ref<boolean>(false);
const lyricIndex = ref<number>(0);

const { proxy } = getCurrentInstance()!; // 拿到当前实例
const lyricRef = useTemplateRef('lyricRef');
const volumeRef = ref<ChildExpose | null>(null);

// ------------------------------ 路由 & store ------------------------------
const route = useRoute();
const router = useRouter();
const store = usePlayerStore();
const aiBus = useAiEventBusStore();

const audioEle = computed(() => store.audioEle);
const mode = computed(() => store.mode);
const playing = computed(() => store.playing);
const playlist = computed(() => store.playlist);
const orderList = computed(() => store.orderList);
const currentIndex = computed(() => store.currentIndex);
const currentMusic = computed(() => store.currentMusic);
const historyList = computed(() => store.historyList);

// ------------------------------ 计算属性 ------------------------------
const picUrl = computed(() => {
  return currentMusic.value.id && currentMusic.value.image
    ? `url(${currentMusic.value.image}?param=300y300)`
    : `url(${MMPLAYER_CONFIG.BACKGROUND})`;
});

const percentMusic = computed(() => {
  const duration = currentMusic.value.duration;
  return currentTime.value && duration ? currentTime.value / duration : 0;
});

// ------------------------------ watch ------------------------------
watch(currentMusic, (newMusic, oldMusic) => {
  if (!newMusic.id) {
    lyric.value = [];
    return;
  }
  if (newMusic.id === oldMusic.id) return;

  audioEle.value!.src = newMusic.url;
  lyricIndex.value = currentTime.value = currentProgress.value = 0;
  silencePromise(audioEle.value!.play());
  nextTick(() => {
    _getLyric(newMusic.id);
  });
});

watch(playing, (newPlaying) => {
  nextTick(() => {
    newPlaying
      ? silencePromise(audioEle.value!.play())
      : audioEle.value!.pause();
    musicReady.value = true;
  });
});

watch(currentTime, (newTime) => {
  if (nolyric.value) return;
  let index = 0;
  for (let i = 0; i < lyric.value.length; i++) {
    if (newTime > lyric.value[i]!.time) index = i;
  }
  lyricIndex.value = index;
});

watch(route, () => {
  lyricVisible.value = false;
});

// ------------------------------ 生命周期 ------------------------------
onMounted(() => {
  nextTick(() => {
    if (audioEle.value) {
      initPlayer();
    }
    initKeyDown();
    volumeChange(volume.value);
  });
});

watch(audioEle, (newEle) => {
  if (newEle) {
    initPlayer();
  }
});

watch(
  () => aiBus.music_control,
  (event) => {
    if (!event) return;
    if (event.payload === 'prev') {
      prev();
    } else if (event.payload === 'next') {
      next();
    } else if (event.payload === 'play') {
      play();
    }
  },
);
watch(
  () => aiBus.play_song,
  (event) => {
    if (!event) return;
    searchAndPlay(event.payload as string);
  },
);
watch(
  () => aiBus.volume_control,
  (event) => {
    console.log('11111111111111111111111', event, audioEle.value!.muted);
    const action = event?.action || 'up';
    const value = event?.value || 0.2;
    const applyDelta = (delta: number) => {
      const nextValue = Math.max(0, Math.min(1, volume.value + delta));
      volumeChange(Number(nextValue.toFixed(2)));
    };
    switch (action) {
      case 'mute':
        if (!audioEle.value!.muted) volumeRef.value?.handleToggleVolume();
        break;
      case 'unmute':
        if (audioEle.value!.muted) volumeRef.value?.handleToggleVolume();
        break;
      case 'down': {
        applyDelta(-value);
        break;
      }
      case 'set': {
        volumeChange(value);
        break;
      }
      case 'up':
      default: {
        applyDelta(value);
      }
    }
  },
);

// ------------------------------ 方法 ------------------------------
function initPlayer() {
  bbPlayerMusic.initAudio({
    audioEle,
    currentMusic,
    currentTime,
    currentProgress,
    musicReady,
    mode,
    playlist,
    historyList,
    setPlaying: store.setPlaying,
    next,
    prev,
    loop,
    setHistory: store.setHistory,
    getLastSwitchAction: () => store.lastSwitchAction,
    toast: proxy?.$bbToast, // 传入全局toast
  });
}

function initKeyDown() {
  document.onkeydown = (e) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          play();
          break;

        case 'ArrowLeft':
          prev();
          break;

        case 'ArrowRight':
          next();
          break;

        case 'ArrowUp': {
          const plus = Math.min(1, Number((volume.value + 0.1).toFixed(1)));
          volumeChange(plus);
          break;
        }

        case 'ArrowDown': {
          const reduce = Math.max(0, Number((volume.value - 0.1).toFixed(1)));
          volumeChange(reduce);
          break;
        }

        case 'o':
        case 'O':
          modeChange();
          break;
      }
    }
  };
}

function prev(flag = false) {
  if (!isMusicPlay()) return;
  store.setLastSwitchAction('prev');
  if (playlist.value.length === 1) {
    if (flag) {
      store.setCurrentIndex(-1);
      store.setPlaying(false);
      return;
    }
    loop();
  } else {
    let index = currentIndex.value - 1;
    if (index < 0) index = playlist.value.length - 1;
    store.setCurrentIndex(index);
    if (!playing.value && musicReady.value) store.setPlaying(true);
    musicReady.value = false;
  }
}

function play() {
  if (!isMusicPlay()) return;
  store.setPlaying(!playing.value);
}

function next(flag = false) {
  if (!isMusicPlay()) return;
  store.setLastSwitchAction('next');

  const length = playlist.value.length;
  if (
    (length - 1 === currentIndex.value && mode.value === PLAY_MODE.ORDER) ||
    (length === 1 && flag)
  ) {
    store.setCurrentIndex(-1);
    store.setPlaying(false);
    return;
  }
  if (length === 1) {
    loop();
  } else {
    let index = currentIndex.value + 1;
    if (index === length) index = 0;
    if (!playing.value && musicReady.value) store.setPlaying(true);
    store.setCurrentIndex(index);
    musicReady.value = false;
  }
}

function loop() {
  audioEle.value!.currentTime = 0;
  silencePromise(audioEle.value!.play());
  store.setPlaying(true);
  if (lyric.value.length > 0) lyricIndex.value = 0;
}

function progressMusic(percent: number) {
  currentTime.value = currentMusic.value.duration * percent;
}

function progressMusicEnd(percent: number) {
  audioEle.value!.currentTime = currentMusic.value.duration * percent;
}

function modeChange() {
  const newMode = (mode.value + 1) % 4;
  store.setPlayMode(newMode);
  if (newMode === PLAY_MODE.LOOP) return;
  let list: SongDetailItem[] = [];
  switch (newMode) {
    case PLAY_MODE.LIST_LOOP:
    case PLAY_MODE.ORDER:
      list = orderList.value;
      break;
    case PLAY_MODE.RANDOM:
      list = randomSortArray(orderList.value);
      break;
  }
  resetCurrentIndex(list);
  store.setPlaylist(list);
}

function resetCurrentIndex(list: SongDetailItem[]) {
  const index = list.findIndex((item) => item.id === currentMusic.value.id);
  store.setCurrentIndex(index);
}

function openComment() {
  if (!isMusicPlay()) return;
  router.push(`/music/comment/${currentMusic.value.id}`);
}

function isMusicPlay() {
  if (!currentMusic.value.id) {
    proxy!.$bbToast?.('还没有播放歌曲哦,请先选择一首你喜欢的音乐吧！');
    return false;
  }
  return true;
}

function volumeChange(percent: number) {
  volume.value = percent;
  audioEle.value!.muted = percent === 0;
  audioEle.value!.volume = percent;
  setVolume(percent);
}

function getModeIconType() {
  return {
    [PLAY_MODE.LIST_LOOP]: 'loop',
    [PLAY_MODE.ORDER]: 'sequence',
    [PLAY_MODE.RANDOM]: 'random',
    [PLAY_MODE.LOOP]: 'loop-one',
  }[mode.value];
}

function getModeIconTitle() {
  const key = 'Ctrl + O';
  return {
    [PLAY_MODE.LIST_LOOP]: `列表循环 ${key}`,
    [PLAY_MODE.ORDER]: `顺序播放 ${key}`,
    [PLAY_MODE.RANDOM]: `随机播放 ${key}`,
    [PLAY_MODE.LOOP]: `单曲循环 ${key}`,
  }[mode.value];
}

function handleOpenLyric() {
  lyricVisible.value = true;
  nextTick(() => {
    if (lyricRef.value) lyricRef.value.calcTop();
  });
}

function handleCloseLyric() {
  lyricVisible.value = false;
}

function _getLyric(id: string) {
  getLyric(id).then((res) => {
    if (res.lrc && res.lrc.lyric) {
      nolyric.value = false;
      lyric.value = parseLyric(res.lrc.lyric);
    } else {
      nolyric.value = true;
    }
    silencePromise(audioEle.value!.play());
  });
}
</script>
<style lang="less">
.router-view {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.music {
  padding: 75px 25px 25px 25px;
  width: 100%;
  max-width: 1750px;
  margin: 0 auto;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  .music-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    width: 100%;
    .music-left {
      flex: 1;
      width: 100%;
      overflow: hidden;
    }
    .music-right {
      position: relative;
      width: 310px;
      margin-left: 10px;
      .close-lyric {
        position: absolute;
        top: 0;
        z-index: 1;
        cursor: pointer;
      }
    }
  }

  /*底部bbPlayer-bar*/
  .music-bar {
    display: flex;
    align-items: center;
    width: 100%;
    padding-top: 15px;
    color: #fff;
    &.disable {
      // pointer-events: none;
      opacity: 0.6;
    }
    .icon-color {
      color: #fff;
    }
    .music-bar-btns {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 180px;
      .control-play {
        .flex-center;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        // color: #fff;
        color: rgba(255, 255, 255, 0.7);
        background-color: rgba(255, 255, 255, 0.3);
        .play-shift {
          transform: translateX(2px);
        }
      }
    }

    .flex-center;
    .btn-prev {
      width: 19px;
      min-width: 19px;
      height: 20px;
    }
    .btn-play {
      width: 21px;
      min-width: 21px;
      height: 29px;
    }
    .btn-next {
      width: 19px;
      min-width: 19px;
      height: 20px;
    }
    .music-music {
      position: relative;
      width: 100%;
      flex: 1;
      box-sizing: border-box;
      padding-left: 40px;
      font-size: @font_size_small;
      color: @text_color_active;
      .music-bar-info {
        height: 15px;
        padding-right: 80px;
        line-height: 15px;
        text-overflow: ellipsis;
        overflow: hidden;
        display: -webkit-box;
        line-clamp: 1;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }
      .music-bar-time {
        position: absolute;
        top: 0;
        right: 5px;
      }
    }
    .mode,
    .comment,
    .music-bar-volume {
      margin-left: 20px;
    }

    // 音量控制
    .volume-wrapper {
      margin-left: 20px;
      width: 150px;
    }
  }

  /*遮罩*/
  .mmPlayer-mask,
  .mmPlayer-bg {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
  }

  .mmPlayer-mask {
    z-index: -1;
    background-color: @mask_color;
  }

  .mmPlayer-bg {
    z-index: -2;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: 50%;
    filter: blur(12px);
    opacity: 0.7;
    transition: all 0.8s;
    transform: scale(1.1);
  }

  @media (min-width: 960px) {
    .close-lyric {
      display: none;
    }
  }

  //当屏幕小于960时
  @media (max-width: 960px) {
    .music-right {
      display: none;
      &.show {
        display: block;
        margin-left: 0;
        width: 100%;
      }
    }
  }
  //当屏幕小于768时
  @media (max-width: 768px) {
    padding: 75px 15px 5px 15px;

    .music-bar {
      padding-top: 10px;
      .music-bar-info span,
      .music-bar-volume .bbprogress {
        display: none;
      }
    }
  }
  //当屏幕小于520时
  @media (max-width: 520px) {
    .music-bar {
      position: relative;
      flex-direction: column;
      .music-bar-btns {
        width: 60%;
        margin-top: 10px;
        order: 2;
      }
      .music-music {
        padding-left: 0;
        order: 1;
      }
      .mode,
      .comment {
        position: absolute;
        bottom: 20px;
        margin: 0;
      }
      .mode {
        left: 5px;
      }
      .comment {
        right: 5px;
      }
      .music-bar-volume {
        display: none;
      }
    }
  }
}
</style>
